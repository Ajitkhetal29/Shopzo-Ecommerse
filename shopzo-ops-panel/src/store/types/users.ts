type Department = {
    _id: string;
    name: string;
    code?: string;
};

type Role = {
    _id: string;
    name: string;
    level: number;
    code?: string;
};

export type User = {
    _id: string;
    name: string;
    email: string;
    department: Department | string; // Can be object or string for backward compatibility
    role: Role | string; // Can be object or string for backward compatibility
    createdAt: string;
    updatedAt: string;
    level: number; // Added level to User type
}