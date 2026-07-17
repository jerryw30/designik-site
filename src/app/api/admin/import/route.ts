import { importBackup } from "@/app/admin/tools/actions";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return importBackup(await request.formData());
}
