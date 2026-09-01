export interface TripVehicleMaintenanceItem {
    id: string;
    tripId: string;
    itemId: string;
    itemName?: string;
    date: string;
    description: string;
    cost: number;

}

// export interface TripMaintenanceItem {
//     id: string;
//     description: string;
//     cost: number;
// }