"use client";

import { CustomColumnDef, DataTable } from "@/components/ui/data-table";
import { getQueryParamsOptions, useIsMobile } from "@/utils/utils";
import { PaginationState, SortingState } from "@tanstack/react-table";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import axios from "axios";
import { QueryParams } from "@/utils/interfaces";
import { columns, User } from "./columns";
import UpdateDialog from "./update-dialog";
import UpdateDrawer from "./update-drawer";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

interface UserResponse {
  items: User[];
  total: number;
}

const getData = async (token: string, params: QueryParams) => {
  const usersOptions = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    url: `${BACKEND_URL}/api/v2/users`,
    params: getQueryParamsOptions(params),
  };

  const response = await axios(usersOptions);
  const {
    data: {
      payload: { items, total },
    },
  } = response;

  return { items, total };
};

export default function UsersTab() {
  const isMobile = useIsMobile();
  const { data: session } = useSession();
  const { user: { token = "", id: userId = "" } = {} } = session || {};

  const [data, setData] = useState<UserResponse>({ items: [], total: 0 });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>();

  const loadData = async () => {
    setIsLoading(true);
    const data = await getData(token, { sorting, pagination });
    setData(data);
    setIsLoading(false);
  };

  useEffect(() => {
    if (!token) return;
    (async () => {
      await loadData();
    })();
  }, [sorting, pagination, token]);

  const newColumns: CustomColumnDef<User>[] = [
    ...columns,
    {
      id: "actions",
      header: () => {
        return <div className="text-center">Actions</div>;
      },
      cell: ({ row }) => {
        const { original: { id } = {} } = row;
        if (id === userId) {
          return null;
        }

        if (isMobile) {
          return <UpdateDrawer item={row.original} updateData={loadData} />;
        }

        return <UpdateDialog item={row.original} updateData={loadData} />;
      },
    },
  ];

  return (
    <div className="my-6">
      <DataTable
        columns={newColumns}
        data={data.items}
        serverSide={{
          totalRows: data.total,
          isLoading,
          setServerSorting: setSorting,
          setServerPagination: setPagination,
        }}
      ></DataTable>
    </div>
  );
}
