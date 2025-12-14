// Test fixture - component with unguarded response.json() call
export default function UnguardedFetch() {
  const fetchData = () => {
    fetch('/api/data').then(response => response.json());
  };
  
  return <button onClick={fetchData}>Fetch Data</button>;
}