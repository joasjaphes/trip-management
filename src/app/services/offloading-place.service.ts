import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { OffloadingPlace } from '../models/offloading-place.model';
import { CommonService } from './common.service';

@Injectable({
	providedIn: 'root'
})
export class OffloadingPlaceService {
	private http = inject(HttpClientService);
	private commonService = inject(CommonService);
	private offloadingPlaces = signal<OffloadingPlace[]>([]);
	private isLoading = signal(false);
	private error = signal<string | null>(null);

	readonly allOffloadingPlaces = this.offloadingPlaces.asReadonly();
	readonly loading = this.isLoading.asReadonly();
	readonly errorMessage = this.error.asReadonly();
	readonly activeOffloadingPlacesCount = computed(() => this.offloadingPlaces().length);

	constructor() {
		this.getAll();
	}

	async getAll(): Promise<void> {
		this.isLoading.set(true);
		this.error.set(null);

		try {
			const places = await this.http.get<OffloadingPlace[]>('offloading-places');
			this.offloadingPlaces.set(places || []);
		} catch (error) {
			this.error.set(String(error || 'Failed to fetch offloading places'));
			console.error('Failed to fetch offloading places:', error);
			this.offloadingPlaces.set([]);
		} finally {
			this.isLoading.set(false);
		}
	}

	getById(id: string): OffloadingPlace | undefined {
		return this.offloadingPlaces().find((place) => place.id === id);
	}

	findByName(name: string): OffloadingPlace | undefined {
		const normalized = name.trim().toLowerCase();
		return this.offloadingPlaces().find(
			(place) => place.name.trim().toLowerCase() === normalized
		);
	}

	async create(payload: {
		name: string;
		latitude?: number;
		longitude?: number;
	}): Promise<string> {
		this.isLoading.set(true);
		this.error.set(null);

		try {
			const id = this.commonService.makeid();
			await this.http.post('offloading-places', {
				id,
				name: payload.name,
				latitude: payload.latitude,
				longitude: payload.longitude,
			});
			await this.getAll();
			return id;
		} catch (error) {
			this.error.set(String(error || 'Failed to create offloading place'));
			console.error('Failed to create offloading place:', error);
			throw error;
		} finally {
			this.isLoading.set(false);
		}
	}

	async update(
		id: string,
		payload: {
			name?: string;
			latitude?: number;
			longitude?: number;
		}
	): Promise<void> {
		this.isLoading.set(true);
		this.error.set(null);

		try {
			const existing = this.getById(id);
			await this.http.put('offloading-places', {
				id,
				name: payload.name ?? existing?.name,
				latitude: payload.latitude ?? existing?.latitude,
				longitude: payload.longitude ?? existing?.longitude,
			});
			await this.getAll();
		} catch (error) {
			this.error.set(String(error || 'Failed to update offloading place'));
			console.error('Failed to update offloading place:', error);
			throw error;
		} finally {
			this.isLoading.set(false);
		}
	}

	get all() {
		return this.allOffloadingPlaces;
	}
}
