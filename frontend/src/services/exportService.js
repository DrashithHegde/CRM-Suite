import Papa from 'papaparse';
import { saveAs } from 'file-saver';
import { format } from 'date-fns';

export const exportToCSV = (data, filename = 'leads-export') => {
  const formattedData = data.map((lead) => ({
    ID: lead.id,
    Name: lead.name,
    Email: lead.email,
    Phone: lead.phone || 'N/A',
    Source: lead.source?.replace('_', ' ').toUpperCase(),
    Status: lead.status.toUpperCase(),
    'Notes Count': lead.notes?.length || 0,
    'Created Date': format(new Date(lead.createdAt), 'MMM dd, yyyy hh:mm a'),
    'Last Updated': format(new Date(lead.updatedAt), 'MMM dd, yyyy hh:mm a'),
  }));

  const csv = Papa.unparse(formattedData);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, `${filename}-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.csv`);
};

export const exportToJSON = (data, filename = 'leads-export') => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  saveAs(blob, `${filename}-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.json`);
};
