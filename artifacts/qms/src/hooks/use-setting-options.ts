import { useListSettingOptions } from "@workspace/api-client-react";

export function useSettingOptions(category: string, fallback: string[] = []): string[] {
  const { data } = useListSettingOptions({ category });
  return data?.map((o) => o.value) ?? fallback;
}
