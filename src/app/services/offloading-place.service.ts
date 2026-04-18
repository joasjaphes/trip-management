import { inject, Injectable, signal } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { OffloadingPlace } from '../models/offloading-place.model';

@Injectable({
	providedIn: 'root'
})
export class OffloadingPlaceService {
	private http = inject(HttpClientService);

	private allOffloadingPlaces = signal<OffloadingPlace[]>([]);

	constructor() {
		this.getAll();
	}

	async getAll(): Promise<void> {
		try {
			const places = await this.http.get<OffloadingPlace[]>('offloading-places');
			this.allOffloadingPlaces.set(places || []);
		} catch (error) {
			console.error('Failed to fetch offloading places:', error);
			this.allOffloadingPlaces.set([]);
		}
	}

	findByName(name: string): OffloadingPlace | undefined {
		if (!name) return undefined;
		return this.allOffloadingPlaces().find(
			(place) => place.name.toLowerCase() === name.toLowerCase()
		);
	}

	get all() {
		return this.allOffloadingPlaces.asReadonly();
	}
}
