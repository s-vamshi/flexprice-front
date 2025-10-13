import { AxiosClient } from '@/core/axios/verbs';
import { Pagination } from '@/models';
import { CreateMeterRequest, UpdateMeterRequest, MeterResponse, GetAllMetersResponse, ListMetersResponse } from '@/types/dto';

export class MeterApi {
	private static baseUrl = '/meters';

	public static async createMeter(data: CreateMeterRequest) {
		return await AxiosClient.post<MeterResponse, CreateMeterRequest>(this.baseUrl, data);
	}

	public static async getAllMeters({ limit, offset }: Pagination) {
		return await AxiosClient.get<GetAllMetersResponse>(`${this.baseUrl}?limit=${limit}&offset=${offset}`);
	}

	public static async getAllActiveMeters() {
		return await AxiosClient.get<GetAllMetersResponse>(`${this.baseUrl}?status=published&limit=1000`);
	}

	public static async getMeterById(id: string) {
		return await AxiosClient.get<MeterResponse>(`${this.baseUrl}/${id}`);
	}

	public static async updateMeter(id: string, data: UpdateMeterRequest) {
		return await AxiosClient.put<MeterResponse, UpdateMeterRequest>(`${this.baseUrl}/${id}`, data);
	}

	public static async deleteMeter(id: string) {
		return await AxiosClient.delete<void>(`${this.baseUrl}/${id}`);
	}

	public static async listMeters({ limit, offset }: Pagination) {
		return await AxiosClient.get<ListMetersResponse>(`${this.baseUrl}?limit=${limit}&offset=${offset}`);
	}
}
