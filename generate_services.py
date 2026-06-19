import os

services = {
    'project': ('Project', 'projects', True),
    'project-type': ('ProjectType', 'project-types', True),
    'lead': ('Lead', 'leads', True),
    'user': ('User', 'users', False),
    'role': ('Role', 'roles', False),
    'blog-category': ('BlogCategory', 'blog-categories', True),
    'blog-post': ('BlogPost', 'blog-posts', True),
    'page': ('Page', 'pages', True),
    'landing-page': ('LandingPage', 'landing-pages', True),
    'setting': ('Setting', 'settings', True)
}

template = """import {{ Injectable, inject }} from '@angular/core';
import {{ HttpClient }} from '@angular/common/http';
import {{ Observable }} from 'rxjs';
import {{ environment }} from '../../../environments/environment';
import {{ ApiResponse, PaginatedData, {modelName} }} from '../models/models';

@Injectable({{
  providedIn: 'root'
}})
export class {serviceName}Service {{
  private http = inject(HttpClient);
  private adminUrl = `${{environment.apiUrl}}/admin/{endpoint}`;
  private publicUrl = `${{environment.apiUrl}}/public/{endpoint}`;

  // Admin Methods
  getAll(params: any = {{}}): Observable<ApiResponse<PaginatedData<{modelName}>>> {{
    return this.http.get<ApiResponse<PaginatedData<{modelName}>>>(this.adminUrl, {{ params }});
  }}

  getById(id: number): Observable<ApiResponse<{modelName}>> {{
    return this.http.get<ApiResponse<{modelName}>>(`${{this.adminUrl}}/${{id}}`);
  }}

  create(data: any): Observable<ApiResponse<{modelName}>> {{
    return this.http.post<ApiResponse<{modelName}>>(this.adminUrl, data);
  }}

  update(id: number, data: any): Observable<ApiResponse<{modelName}>> {{
    return this.http.put<ApiResponse<{modelName}>>(`${{this.adminUrl}}/${{id}}`, data);
  }}

  delete(id: number): Observable<ApiResponse<boolean>> {{
    return this.http.delete<ApiResponse<boolean>>(`${{this.adminUrl}}/${{id}}`);
  }}

  {publicMethods}
}}
"""

public_template = """// Public Methods
  getPublic(params: any = {{}}): Observable<ApiResponse<PaginatedData<{modelName}> | {modelName}[]>> {{
    return this.http.get<ApiResponse<PaginatedData<{modelName}> | {modelName}[]>>(this.publicUrl, {{ params }});
  }}

  getPublicBySlug(slug: string): Observable<ApiResponse<{modelName}>> {{
    return this.http.get<ApiResponse<{modelName}>>(`${{this.publicUrl}}/${{slug}}`);
  }}"""

out_dir = 'frontend/src/app/core/services'

for key, (modelName, endpoint, has_public) in services.items():
    s_name = key.replace('-', ' ').title().replace(' ', '')
    pub = public_template.format(modelName=modelName) if has_public else ""
    content = template.format(modelName=modelName, serviceName=s_name, endpoint=endpoint, publicMethods=pub)
    
    with open(f"{out_dir}/{key}.service.ts", 'w', encoding='utf-8') as f:
        f.write(content)

print("Generated services")
