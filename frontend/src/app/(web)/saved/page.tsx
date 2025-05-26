import { getApiServer } from "@/lib/api-server";
import SavedContainer from "./components/saved-container";

export default async function Page() {
  const apiServer = await getApiServer();

  const options = {
    method: "GET",
    url: "/animes/saved",
  };

  const response = await apiServer(options);
  const {
    data: {
      payload: { items },
    },
  } = response;

  if (items.length === 0) {
    return (
      <div className="flex flex-col gap-y-6">
        <span className="text-3xl font-semibold">
          You haven&apos;t saved any animes yet!
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-y-4">
      <span className="text-3xl font-semibold">Saved Animes</span>
      <SavedContainer items={items} />
    </div>
  );
}
