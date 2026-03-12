import { Injectable, inject } from '@angular/core';
import { HttpClientService } from './http-client.service';

type UploadedFile = {
  fileName: string;
  filePath: string;
  fileUrl: string;
};

@Injectable({
  providedIn: 'root',
})
export class FileUploadService {
  private http = inject(HttpClientService);

  private normalizeFilePath(filePath: string): string {
    const trimmed = filePath.trim();

    if (/^https?:\/\//i.test(trimmed)) {
      return trimmed;
    }

    const withoutQuery = trimmed.split('?')[0].replace(/\\/g, '/');
    const markerIndex = withoutQuery.lastIndexOf('/uploads/');
    if (markerIndex >= 0) {
      return withoutQuery.slice(markerIndex);
    }

    const noLeadingSlash = withoutQuery.replace(/^\/+/, '');
    if (noLeadingSlash.startsWith('uploads/')) {
      return `/${noLeadingSlash}`;
    }

    const fileName = noLeadingSlash.split('/').filter(Boolean).pop();
    return fileName ? `/uploads/${fileName}` : '/uploads';
  }

  async uploadFile(file: File): Promise<UploadedFile> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await this.http.upload('upload', formData);
    const filePath = response?.filePath;

    if (!filePath || typeof filePath !== 'string') {
      throw 'Upload completed without a valid file path.';
    }

    const fileUrl = await this.resolveFileUrl(filePath);
    if (!fileUrl) {
      throw 'Upload completed, but the file URL could not be resolved.';
    }

    return {
      fileName: this.getFileName(filePath) || file.name,
      filePath,
      fileUrl,
    };
  }

  async resolveFileUrl(filePath: string | undefined): Promise<string | undefined> {
    if (!filePath) {
      return undefined;
    }

    const normalizedPath = this.normalizeFilePath(filePath);
    if (/^https?:\/\//i.test(normalizedPath)) {
      return normalizedPath;
    }

    return this.http.getImageUrl(normalizedPath.replace(/^\/+/, ''));
  }

  getFileName(filePath: string | undefined): string | undefined {
    if (!filePath) {
      return undefined;
    }

    const normalizedPath = this.normalizeFilePath(filePath).split('?')[0];
    const fileName = normalizedPath.split('/').filter(Boolean).pop();
    return fileName ? decodeURIComponent(fileName) : undefined;
  }
}