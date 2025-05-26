import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Dashboard from "./components/dashboard";
import Users from "./components/users/users";
import Storage from "./components/storage/storage";

export default function Configuration() {
  return (
    <div className="flex flex-col gap-y-10">
      <Tabs defaultValue="dashboard">
        <TabsList className="w-full py-5 mb-4">
          <TabsTrigger className="w-full text-base py-4" value="dashboard">
            Dashboard
          </TabsTrigger>
          <TabsTrigger className="w-full text-base py-4" value="storage">
            Storage
          </TabsTrigger>
          <TabsTrigger className="w-full text-base py-4" value="user">
            Users
          </TabsTrigger>
        </TabsList>
        <TabsContent value="dashboard">
          <Dashboard />
        </TabsContent>
        <TabsContent value="storage">
          <Storage />
        </TabsContent>
        <TabsContent value="user">
          <Users />
        </TabsContent>
      </Tabs>
    </div>
  );
}
