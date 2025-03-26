"use client";
import React, { useEffect, useState } from "react";
import { DataTable } from "./data-table";
import axios from "axios";
import { columns } from "./columns";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { useAllUserFetch } from "@/hooks/userHook";
import Breadcrumb from "@/components/Breadcrumb";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const Page = () => {
  const { users, userLoader } = useAllUserFetch();
const router = useRouter();
  return (
    <div className=" min-h-screen ">
      <div className="w-full border-b px-2 lg:px-16 py-6 flex items-center gap-6">
        <Button
          variant="outline"
          className="font-body py-6 flex gap-4 bg-background text-xl"
          onClick={() => router.push("/dashboard?tab=social")}
        >
          <ArrowLeft /> Back
        </Button>
        <h1 className="font-heading text-2xl  lg:text-4xl font-bold">Users</h1>
      </div>
      <p className="mb-10"></p>
      {userLoader && (
        <Skeleton className="w-full h-[400px]" />
      )}
      {!userLoader && (
        <Card className="p-4 pt-0 font-body m-4 mx-32">
          <DataTable columns={columns} data={users} />
        </Card>
      )}
    </div>
  );
};

export default Page;
