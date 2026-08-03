
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

export interface FileMetadata {
  id?: string;
  filename?: string;
  original_name?: string;
  mime_type?: string;
  size?: number;
  storage_path?: string;
  thumbnail_url?: string;
  workspace_id?: string;
  created_at?: string;
}

export interface ExternalSearchResult {
  title: string;
  snippet: string;
  link: string;
  displayLink?: string;
  image?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  sourceUrl?: string;
  sourceDomain?: string;
  width?: number;
  height?: number;
  fileFormat?: string;
}

@Injectable({ providedIn: 'root' })
export class FilesService {
  private apiUrl = `${environment.apiUrl}/workspaces`;

  constructor(private http: HttpClient) {}

  uploadFile(workspaceId: string, file: File): Observable<FileMetadata> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<FileMetadata>(`${this.apiUrl}/${workspaceId}/files`, formData);
  }

  getFilesByWorkspace(workspaceId: string): Observable<FileMetadata[]> {
    return this.http.get<FileMetadata[]>(`${this.apiUrl}/${workspaceId}/files`);
  }

  externalSearch(query: string, type: 'web' | 'image' = 'web') {
    const params = { q: query, type };
    return this.http.get<ExternalSearchResult[]>(`${environment.apiUrl}/search/external`, { params });
  }

  searchFiles(workspaceId: string, q: string): Observable<FileMetadata[]> {
    const params = { q };
    return this.http.get<FileMetadata[]>(`${this.apiUrl}/${workspaceId}/search`, { params });
  }
}
