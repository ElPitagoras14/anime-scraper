import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TypographyH6 } from "@/components/ui/typography";
import AccountTab from "./components/account-tab";
import UsersTab from "./components/users-tab";
import AppTab from "./components/app-tab";
import { auth } from "@/auth";

export default async function Settings() {
  const { user: { isAdmin = false } = {} } = (await auth()) || {};
  return (
    <main className="flex flex-col items-center py-4 md:py-8">
      <div className="w-[90%] lg:w-[60%]">
        <Tabs defaultValue="account" orientation="horizontal">
          <TabsList className="w-[100%] h-11 lg:h-12">
            <TabsTrigger value="account" className="w-[100%]">
              <TypographyH6>Account</TypographyH6>
            </TabsTrigger>
            <TabsTrigger value="app" className="w-[100%]">
              <TypographyH6>App Settings</TypographyH6>
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="users" className="w-[100%]">
                <TypographyH6>Users Management</TypographyH6>
              </TabsTrigger>
            )}
          </TabsList>
          <TabsContent value="account">
            <AccountTab />
          </TabsContent>
          <TabsContent value="app">
            <AppTab />
          </TabsContent>
          {isAdmin && (
            <TabsContent value="users">
              <UsersTab />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </main>
  );
}
