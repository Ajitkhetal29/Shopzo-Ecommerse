type User = {
  department?: { name: string } | string;
  role?: { name: string } | string;
};

const nameOf = (v: { name?: string } | string | undefined) =>
  typeof v === "object" && v ? v.name : v;

const getheaderMenuItems = (
  user: User | null,
): { label: string; href: string }[] => {
  const dept = nameOf(user?.department);
  const roleName = nameOf(user?.role);

  console.log("Department:", dept);
  console.log("Role:", roleName);

  if (dept === "Admin") {
    switch (roleName) {
      case "Admin":
        return [
          { label: "Dashboard", href: "/dashboards/admin" },
          { label: "Users", href: "/users" },
          { label: "Warehouses", href: "/warehouse" },
          { label: "Vendors", href: "/vendor" }, 
          { label: "General", href: "/genral" },
          { label: "Support", href: "/dashboards/support" },
          { label: "Products", href: "/products" },
          { label: "Orders", href: "/orders" },
        ];
    }
  }

  if (dept === "delivery") {
    switch (roleName) {
      case "Manager":
        return [
          { label: "Dashboard", href: "/dashboards/delivery" },
          { label: "Orders", href: "/delivery/orders" },
          { label: "History", href: "/delivery/orders/history" },
          { label: "Team", href: "/delivery/team" },
        ];

      case "Team Leader":
        return [
          { label: "Dashboard", href: "/dashboards/delivery" },
          { label: "Orders", href: "/delivery/orders" },
          { label: "History", href: "/delivery/orders/history" },
          { label: "Team", href: "/delivery/team" },
        ];

      case "Team Member":
        return [
          { label: "Dashboard", href: "/dashboards/delivery" },
          { label: "Orders", href: "/delivery/orders" },
          { label: "History", href: "/delivery/orders/history" },
        ];
    }
    return [];
  }

  if (dept?.toLocaleLowerCase() === "support") {
    switch (roleName) {
      case "Manager":
        return [
          { label: "Dashboard", href: "/dashboards/support" },
          { label: "Tickets", href: "/support/tickets" },
          { label: "History", href: "/support/tickets/history" },
          { label: "Team", href: "/support/team" },
        ];

      case "Team Leader":
        return [
          { label: "Dashboard", href: "/dashboards/support" },
          { label: "Tickets", href: "/support/tickets" },
          { label: "History", href: "/support/tickets/history" },
          { label: "Team", href: "/support/team" },
        ];

      case "Team Member":
        return [
          { label: "Dashboard", href: "/dashboards/support" },
          { label: "Tickets", href: "/support/tickets" },
          { label: "History", href: "/support/tickets/history" },
        ];
    }
  }

  return [];
};

export { getheaderMenuItems };
