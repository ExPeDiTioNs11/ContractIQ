export type DatasetInfo = {
  id: string;
  label: string;
  description: string;
};

export const DATASETS: DatasetInfo[] = [
  {
    id: "subscription",
    label: "Software Subscription",
    description:
      "Subscription contract + price & seat amendments, a promo notice and an invoice.",
  },
  {
    id: "office-lease",
    label: "Office Lease (complex)",
    description:
      "Commercial lease with rent indexation, a side letter and conflicting parking & subletting terms.",
  },
  {
    id: "employment",
    label: "Employment Contract (complex)",
    description:
      "Employment agreement with a promotion, a conflicting remote-work policy vs. individual side letter, and bonus/non-compete changes.",
  },
];

export const DATASET_IDS = DATASETS.map((d) => d.id);

export function isValidDataset(id: string): boolean {
  return DATASET_IDS.includes(id);
}
