import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

interface Package {
  id: number;
  direccion: string;
  estatus: string;
  deliveryid: number | null;
}

interface PackageResponse {
  paquetes: Package[];
}

interface SinglePackageResponse {
  paquete: Package;
}

@Injectable({ providedIn: 'root' })
export class PackagesService {
  private apiUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  // Obtener paquetes según el rol del usuario
  getPackages(): Observable<PackageResponse> {
    const userId = localStorage.getItem('userId');
    const userRole = localStorage.getItem('userRole');
    
    // Si es delivery, solo traer sus paquetes asignados
    if (userRole === 'delivery' && userId) {
      return this.http.get<PackageResponse>(`${this.apiUrl}/packages/delivery/${userId}`);
    }
    // Si es admin, traer todos los paquetes no asignados
    return this.http.get<PackageResponse>(`${this.apiUrl}/packages`);
  }

  addPackage(packageData: { direccion: string }): Observable<SinglePackageResponse> {
    return this.http.post<SinglePackageResponse>(`${this.apiUrl}/addPackages`, packageData);
  }

  assignPackage(packageId: number, deliveryId: number): Observable<SinglePackageResponse> {
    return this.http.put<SinglePackageResponse>(
      `${this.apiUrl}/assignPackage/${packageId}`,
      { delivery_id: deliveryId }
    );
  }

  // Nuevo método para obtener paquetes asignados a un delivery específico
  getAssignedPackages(deliveryId: number): Observable<PackageResponse> {
    return this.http.get<PackageResponse>(`${this.apiUrl}/packages/delivery/${deliveryId}`);
  }

  updatePackageStatus(packageId: number, newStatus: string): Observable<any> {
    return this.http.put<any>(
        `${this.apiUrl}/updatePackageStatus/${packageId}`,
        { estatus: newStatus }
    );
    }
}