// Test fixture for crash vector detection
export default function TestComponent() {
  // This should be detected as a throw error violation
  throw new Error('test error for detection');
  
  return <div>Test</div>;
}