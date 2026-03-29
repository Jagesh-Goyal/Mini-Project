import Card from '@/components/ui/Card';

export default function Settings() {
  return (
    <div className='grid gap-4 md:grid-cols-2'>
      <Card title='Profile Settings'>
        <div className='space-y-3'>
          <input className='input' placeholder='Name' />
          <input className='input' placeholder='Email' />
          <input className='input' type='file' />
          <button className='btn-primary'>Save Profile</button>
        </div>
      </Card>
      <Card title='Password Change'>
        <div className='space-y-3'>
          <input className='input' type='password' placeholder='Old password' />
          <input className='input' type='password' placeholder='New password' />
          <input className='input' type='password' placeholder='Confirm password' />
          <button className='btn-primary'>Update Password</button>
        </div>
      </Card>
    </div>
  );
}
