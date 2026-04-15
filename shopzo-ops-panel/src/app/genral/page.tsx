"use client";

import Departments from "./components/Departments";
import Roles from "./components/Roles";
import Categories from "./components/Categories";
import Subcategories from "./components/Subcategories";

const GeneralPage = () => {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-8 px-4 sm:px-6 lg:px-8 transition-colors">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">General</h1>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Manage general settings</p>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Departments />
                    <Roles />
                </div>

                <div className="mt-6">
                    <Categories />
                </div>
                <div className="mt-6">
                    <Subcategories />
                </div>
            </div>
        </div>
    );
};

export default GeneralPage;
