export type Department = {
    _id: string;
    name: string;
    description?: string;
};
export type Role = {
    _id: string;
    name: string;
    description?: string;
    level: number;
    department?: string | Department;
};


