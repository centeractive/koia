import { ExportFormat } from 'app/shared/model/export-format.enum';

export const EXPORT_FILE_EXTENSIONS: Readonly<Record<ExportFormat, string>> = {
   [ExportFormat.CSV]: '.csv',
   [ExportFormat.JSON]: '.json',
   [ExportFormat.EXCEL]: '.xlsx',
   [ExportFormat.PNG]: '.png'
};

export const RAW_DATA_FILE_BASE_NAME = 'Raw-Data';

export const PIVOT_TABLE_FILE_BASE_NAME = 'PivotTable';
