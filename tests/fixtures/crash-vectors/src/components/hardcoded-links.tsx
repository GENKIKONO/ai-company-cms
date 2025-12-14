// Test fixture - component with hardcoded dashboard URLs
import Link from 'next/link';

export default function HardcodedLinks() {
  return (
    <div>
      <Link href="/dashboard">Dashboard</Link>
      <Link href="/dashboard/settings">Settings</Link>
      <a href="/dashboard/profile">Profile</a>
    </div>
  );
}