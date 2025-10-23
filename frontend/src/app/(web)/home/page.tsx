import LastDownload from "./components/last-download";
import { auth } from "@/auth";
import Statistics from "./components/statistics";
import InEmission from "./components/in-emission";

export default async function Home() {
  const session = await auth();

  if (!session?.user) return null;

  return (
    <div className="flex justify-center">
      <div className="grid grid-cols-4 gap-4">
        <Statistics />
        <LastDownload role={session.user.role} />
        <InEmission/>
      </div>
    </div>
  );
}
