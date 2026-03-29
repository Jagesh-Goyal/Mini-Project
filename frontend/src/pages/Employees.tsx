import { useEffect, useMemo, useState } from 'react';
import Card from '@/components/ui/Card';
import Modal from '@/components/ui/Modal';
import Table from '@/components/ui/Table';
import { employeeApi } from '@/api/employeeApi';
import type { Employee } from '@/types';

export default function Employees() {
  const [rows, setRows] = useState<Employee[]>([]);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    employeeApi.list().then((res) => setRows(res.data));
  }, []);

  const filtered = useMemo(
    () => rows.filter((r) => `${r.name} ${r.email}`.toLowerCase().includes(search.toLowerCase())),
    [rows, search],
  );

  return (
    <div className='space-y-4'>
      <Card title='Employees'>
        <div className='flex flex-wrap gap-3 mb-4'>
          <input className='input max-w-sm' placeholder='Search by name or email' value={search} onChange={(e) => setSearch(e.target.value)} />
          <button className='btn-primary' onClick={() => setOpen(true)}>Add Employee</button>
        </div>
        <Table
          columns={[
            { key: 'name', label: 'Name' },
            { key: 'department', label: 'Department' },
            { key: 'job_title', label: 'Role' },
            { key: 'email', label: 'Email' },
          ]}
          rows={filtered}
        />
      </Card>
      <Modal open={open} title='Add Employee' onClose={() => setOpen(false)}>
        <p className='text-sm text-slate-600'>Employee creation form can be expanded here with full validation.</p>
      </Modal>
    </div>
  );
}
