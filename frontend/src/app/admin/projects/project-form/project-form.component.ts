import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ProjectService } from '../../../core/services/project.service';
import { ProjectTypeService } from '../../../core/services/project-type.service';
import { FeatureService } from '../../../core/services/feature.service';
import { ProjectType, Project, Feature } from '../../../core/models/models';
import { QuillModule } from 'ngx-quill';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-project-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, QuillModule],
  templateUrl: './project-form.component.html',
  styleUrl: './project-form.component.scss'
})
export class ProjectFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private projectService = inject(ProjectService);
  private projectTypeService = inject(ProjectTypeService);
  private featureService = inject(FeatureService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  backendUrl = environment.backendUrl;

  projectForm!: FormGroup;
  isEditMode = false;
  projectId: number | null = null;
  isLoading = false;
  isSaving = false;
  projectTypes = signal<ProjectType[]>([]);
  features = signal<Feature[]>([]);
  selectedFeatureIds = signal<number[]>([]);
  slugManuallyEdited = false;

  // Main media tracking
  mainFiles: File[] = [];
  mainFilePreviews: string[] = [];
  existingImages: { id: number; image_path: string; is_primary: boolean }[] = [];
  primaryImageIndex = 0;
  primaryImageId: number | null = null;

  // Unit media tracking (indexed by unit form array index)
  unitFiles: File[][] = [];
  unitFilePreviews: string[][] = [];
  existingUnitImages: string[][] = [];

  // Quill config
  quillModules = {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'align': [] }],
      ['clean']
    ]
  };

  ngOnInit() {
    this.initForm();
    this.loadProjectTypes();
    this.loadFeatures();
    
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEditMode = true;
      this.projectId = +idParam;
      this.loadProject(this.projectId);
    }

    // Auto-generate slug from English title
    this.projectForm.get('title_en')?.valueChanges.subscribe(title => {
      if (!this.isEditMode && !this.slugManuallyEdited && title) {
        this.projectForm.patchValue({
          slug: this.generateSlug(title)
        }, { emitEvent: false });
      }
    });

    this.projectForm.get('slug')?.valueChanges.subscribe(() => {
      this.slugManuallyEdited = true;
    });
  }

  private initForm() {
    this.projectForm = this.fb.group({
      title_ar: ['', Validators.required],
      title_en: ['', Validators.required],
      slug: ['', Validators.required],
      description_ar: [''],
      description_en: [''],
      location: [''],
      status: [true],
      featured: [false],
      price: [null],
      area: [null],
      project_type_id: [null],
      bedrooms: [null],
      delivery_date: [null],
      developer: [''],
      units: this.fb.array([])
    });
  }

  get unitsFormArray(): FormArray {
    return this.projectForm.get('units') as FormArray;
  }

  addUnit(unitData?: any) {
    const unitGroup = this.fb.group({
      id: [unitData?.id || null],
      title_ar: [unitData?.title_ar || ''],
      title_en: [unitData?.title_en || ''],
      area: [unitData?.area || null, [Validators.required, Validators.min(0.1)]],
      price: [unitData?.price || null],
      bedrooms: [unitData?.bedrooms || null],
      bathrooms: [unitData?.bathrooms || null],
      description_ar: [unitData?.description_ar || ''],
      description_en: [unitData?.description_en || ''],
      existing_images: [unitData?.image_paths || []]
    });

    this.unitsFormArray.push(unitGroup);
    this.unitFiles.push([]);
    this.unitFilePreviews.push([]);
    this.existingUnitImages.push(unitData?.image_paths || []);
  }

  removeUnit(index: number) {
    this.unitsFormArray.removeAt(index);
    this.unitFiles.splice(index, 1);
    this.unitFilePreviews.splice(index, 1);
    this.existingUnitImages.splice(index, 1);
  }

  moveUnitUp(index: number) {
    if (index <= 0) return;
    this.swapUnits(index, index - 1);
  }

  moveUnitDown(index: number) {
    if (index >= this.unitsFormArray.length - 1) return;
    this.swapUnits(index, index + 1);
  }

  private swapUnits(i: number, j: number) {
    const controlI = this.unitsFormArray.at(i);
    const controlJ = this.unitsFormArray.at(j);

    this.unitsFormArray.setControl(i, controlJ);
    this.unitsFormArray.setControl(j, controlI);

    // Swap files
    const filesI = this.unitFiles[i];
    this.unitFiles[i] = this.unitFiles[j];
    this.unitFiles[j] = filesI;

    // Swap previews
    const previewsI = this.unitFilePreviews[i];
    this.unitFilePreviews[i] = this.unitFilePreviews[j];
    this.unitFilePreviews[j] = previewsI;

    // Swap existing unit images
    const existingI = this.existingUnitImages[i];
    this.existingUnitImages[i] = this.existingUnitImages[j];
    this.existingUnitImages[j] = existingI;
  }

  private loadProjectTypes() {
    this.projectTypeService.getActive().subscribe({
      next: (res) => {
        this.projectTypes.set(res.data || []);
      },
      error: (err) => console.error('Error loading project types', err)
    });
  }

  private loadFeatures() {
    this.featureService.getActive().subscribe({
      next: (res) => {
        this.features.set(res.data || []);
      },
      error: (err) => console.error('Error loading active features', err)
    });
  }

  private loadProject(id: number) {
    this.isLoading = true;
    this.projectService.getById(id).subscribe({
      next: (res) => {
        const p = res.data;
        this.projectForm.patchValue({
          title_ar: p.title_ar,
          title_en: p.title_en,
          slug: p.slug,
          description_ar: p.description_ar || '',
          description_en: p.description_en || '',
          location: p.location || '',
          status: !!p.status,
          featured: !!p.featured,
          price: p.price,
          area: p.area,
          project_type_id: p.project_type?.id || null,
          bedrooms: p.bedrooms,
          delivery_date: p.delivery_date,
          developer: p.developer || ''
        });

        // Main images
        if (p.images && Array.isArray(p.images)) {
          this.existingImages = p.images.map((img: any) => ({
            id: img.id,
            image_path: img.image_path,
            is_primary: !!img.is_primary
          }));
          const primaryImg = this.existingImages.find(img => img.is_primary);
          if (primaryImg) {
            this.primaryImageId = primaryImg.id;
          }
        }

        // Units
        if ((p as any).units && Array.isArray((p as any).units)) {
          ((p as any).units).forEach((u: any) => {
            this.addUnit(u);
          });
        }

        // Features
        if (p.features && Array.isArray(p.features)) {
          this.selectedFeatureIds.set(p.features.map((f: any) => f.id));
        }

        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading project', err);
        alert('Failed to load project details.');
        this.router.navigate(['/admin/projects']);
      }
    });
  }

  isFeatureSelected(id: number): boolean {
    return this.selectedFeatureIds().includes(id);
  }

  toggleFeature(id: number, event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.selectedFeatureIds.update(ids => [...ids, id]);
    } else {
      this.selectedFeatureIds.update(ids => ids.filter(x => x !== id));
    }
  }

  private generateSlug(text: string): string {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-') // Replace spaces with -
      .replace(/[^\w\-]+/g, '') // Remove all non-word chars
      .replace(/\-\-+/g, '-'); // Replace multiple - with single -
  }

  // Media Handlers
  onMainFileSelect(event: any) {
    const files = event.target.files;
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        this.mainFiles.push(file);
        
        // Generate preview
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.mainFilePreviews.push(e.target.result);
        };
        reader.readAsDataURL(file);
      }
    }
  }

  removeMainFile(index: number) {
    this.mainFiles.splice(index, 1);
    this.mainFilePreviews.splice(index, 1);
    if (this.primaryImageIndex >= this.mainFiles.length) {
      this.primaryImageIndex = 0;
    }
  }

  removeExistingMainImage(index: number) {
    const removed = this.existingImages.splice(index, 1)[0];
    if (this.primaryImageId === removed.id) {
      this.primaryImageId = this.existingImages.length > 0 ? this.existingImages[0].id : null;
    }
  }

  setPrimaryNew(index: number) {
    this.primaryImageIndex = index;
    this.primaryImageId = null;
  }

  setPrimaryExisting(id: number) {
    this.primaryImageId = id;
    this.primaryImageIndex = 0;
  }

  onUnitFileSelect(unitIndex: number, event: any) {
    const files = event.target.files;
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        this.unitFiles[unitIndex].push(file);

        // Generate preview
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.unitFilePreviews[unitIndex].push(e.target.result);
        };
        reader.readAsDataURL(file);
      }
    }
  }

  removeUnitFile(unitIndex: number, fileIndex: number) {
    this.unitFiles[unitIndex].splice(fileIndex, 1);
    this.unitFilePreviews[unitIndex].splice(fileIndex, 1);
  }

  removeExistingUnitImage(unitIndex: number, imgPath: string) {
    const unitGroup = this.unitsFormArray.at(unitIndex);
    const existing = unitGroup.get('existing_images')?.value || [];
    const updated = existing.filter((path: string) => path !== imgPath);
    unitGroup.get('existing_images')?.setValue(updated);
    this.existingUnitImages[unitIndex] = updated;
  }

  isUrlVideo(path: string): boolean {
    if (!path) return false;
    const cleanUrl = path.split('?')[0].toLowerCase();
    return cleanUrl.endsWith('.mp4') || cleanUrl.endsWith('.webm') || cleanUrl.endsWith('.ogg') || cleanUrl.endsWith('.mov');
  }

  isDataUrlVideo(dataUrl: string): boolean {
    return dataUrl.startsWith('data:video/');
  }

  getImageUrl(path: string | null): string {
    if (!path) return 'assets/images/placeholder.jpg';
    if (path.startsWith('data:') || path.startsWith('http://') || path.startsWith('https://')) return path;
    return this.backendUrl + (path.startsWith('/') ? path : '/' + path);
  }

  onSubmit() {
    if (this.projectForm.invalid) {
      this.projectForm.markAllAsTouched();
      return;
    }

    // Validation: Enforce at least one image/video exists
    const hasMainMedia = this.mainFiles.length > 0 || this.existingImages.length > 0;
    if (!hasMainMedia) {
      alert('Please upload or keep at least one project image/video.');
      return;
    }

    this.isSaving = true;
    const formValue = this.projectForm.value;
    const formData = new FormData();

    // Append main fields
    Object.keys(formValue).forEach(key => {
      if (key !== 'units' && formValue[key] !== null && formValue[key] !== undefined) {
        if (typeof formValue[key] === 'boolean') {
          formData.append(key, formValue[key] ? '1' : '0');
        } else {
          formData.append(key, formValue[key]);
        }
      }
    });

    // Append main files
    this.mainFiles.forEach(file => {
      formData.append('images[]', file);
    });

    // Append features
    this.selectedFeatureIds().forEach(id => {
      formData.append('feature_ids[]', id.toString());
    });

    // Primary image indices or ID
    if (this.mainFiles.length > 0 && this.primaryImageId === null) {
      formData.append('primary_image_index', this.primaryImageIndex.toString());
    } else if (this.primaryImageId !== null) {
      formData.append('primary_image_id', this.primaryImageId.toString());
    }

    // Append units fields
    const units = formValue.units || [];
    units.forEach((unit: any, index: number) => {
      if (unit.id) {
        formData.append(`units[${index}][id]`, unit.id.toString());
      }
      formData.append(`units[${index}][title_ar]`, unit.title_ar || '');
      formData.append(`units[${index}][title_en]`, unit.title_en || '');
      formData.append(`units[${index}][area]`, unit.area.toString());
      if (unit.price !== null && unit.price !== undefined) {
        formData.append(`units[${index}][price]`, unit.price.toString());
      }
      if (unit.bedrooms !== null && unit.bedrooms !== undefined) {
        formData.append(`units[${index}][bedrooms]`, unit.bedrooms.toString());
      }
      if (unit.bathrooms !== null && unit.bathrooms !== undefined) {
        formData.append(`units[${index}][bathrooms]`, unit.bathrooms.toString());
      }
      formData.append(`units[${index}][description_ar]`, unit.description_ar || '');
      formData.append(`units[${index}][description_en]`, unit.description_en || '');

      // Existing images for this unit
      const existing = unit.existing_images || [];
      existing.forEach((path: string) => {
        formData.append(`units[${index}][existing_images][]`, path);
      });

      // New files for this unit
      const files = this.unitFiles[index] || [];
      files.forEach(file => {
        formData.append(`unit_images_${index}[]`, file);
      });
    });

    const request$ = this.isEditMode && this.projectId
      ? this.projectService.update(this.projectId, formData)
      : this.projectService.create(formData);

    request$.subscribe({
      next: () => {
        this.isSaving = false;
        this.router.navigate(['/admin/projects']);
      },
      error: (err) => {
        this.isSaving = false;
        console.error('Error saving project', err);
        alert(err?.error?.message || 'Error occurred while saving the project.');
      }
    });
  }
}
