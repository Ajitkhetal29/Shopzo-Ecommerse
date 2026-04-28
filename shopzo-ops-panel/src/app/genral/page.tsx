"use client";

import Departments from "./components/Departments";
import Roles from "./components/Roles";
import Categories from "./components/Categories";
import Subcategories from "./components/Subcategories";

const GeneralPage = () => {
  return (
    <div className="space-y-7 sm:space-y-8">
      <div className="border-b border-slate-200/80 pb-6 dark:border-slate-700/60">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-3xl lg:text-[2rem] lg:leading-tight">
          General settings
        </h1>
        <p className="mt-2 max-w-2xl text-[0.9375rem] leading-relaxed text-slate-600 dark:text-slate-400">
          Manage departments, roles, categories, and subcategories from one workspace.
        </p>
      </div>

      <div>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
          Organization
        </h2>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Departments />
          <Roles />
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
          Catalog structure
        </h2>
        <div className="space-y-5">
          <Categories />
          <Subcategories />
        </div>
      </div>
    </div>
  );
};

export default GeneralPage;
