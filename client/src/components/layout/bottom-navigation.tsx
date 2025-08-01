import { useLocation } from "wouter";
import { Home, Package, Receipt, Users, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";

const navigationItems = [
  {
    path: "/",
    icon: Home,
    label: "Dashboard",
    testId: "nav-dashboard",
  },
  {
    path: "/inventory",
    icon: Package,
    label: "Inventory",
    testId: "nav-inventory",
  },
  {
    path: "/orders",
    icon: Receipt,
    label: "Orders",
    testId: "nav-orders",
  },
  {
    path: "/customers",
    icon: Users,
    label: "Customers",
    testId: "nav-customers",
  },
  {
    path: "/reports",
    icon: BarChart3,
    label: "Reports",
    testId: "nav-reports",
  },
];

export default function BottomNavigation() {
  const [location, setLocation] = useLocation();

  return (
    <nav className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200 px-4 py-2 shadow-lg" data-testid="bottom-navigation">
      <div className="flex items-center justify-around">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path;
          
          return (
            <Button
              key={item.path}
              variant="ghost"
              className={`flex flex-col items-center space-y-1 p-2 h-auto ${
                isActive 
                  ? 'text-primary' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => setLocation(item.path)}
              data-testid={item.testId}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </Button>
          );
        })}
      </div>
    </nav>
  );
}
