export interface CategoryData {
    labels: unknown[];
    dataSets: LabeledValues[];
}

export interface LabeledValues {
    label: string;
    values: number[];
}
