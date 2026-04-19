export function Skeleton({ width = '100%', height = '20px', radius = '8px', margin = '0 0 0.5rem 0' }) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: radius,
        background: 'linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite',
        margin,
      }}
    />
  );
}

export function CardSkeleton() {
  return (
    <div style={{
      background: 'white',
      borderRadius: '16px',
      padding: '1.25rem',
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
      border: '1px solid #f3f4f6'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <Skeleton width="48px" height="48px" radius="12px" />
        <Skeleton width="60px" height="24px" />
      </div>
      <Skeleton width="80%" height="20px" margin="0 0 0.75rem 0" />
      <Skeleton width="60%" height="16px" margin="0 0 1rem 0" />
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <Skeleton width="100px" height="36px" radius="10px" />
        <Skeleton width="100px" height="36px" radius="10px" />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div style={{ display: 'flex', gap: '1rem', padding: '0.75rem 1rem', background: '#f9fafb', borderRadius: '10px' }}>
        <Skeleton width="30%" height="16px" />
        <Skeleton width="20%" height="16px" />
        <Skeleton width="20%" height="16px" />
        <Skeleton width="15%" height="16px" />
        <Skeleton width="15%" height="16px" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{ display: 'flex', gap: '1rem', padding: '0.75rem 1rem', background: 'white', borderRadius: '10px', border: '1px solid #f3f4f6' }}>
          <Skeleton width="30%" height="20px" />
          <Skeleton width="20%" height="20px" />
          <Skeleton width="20%" height="20px" />
          <Skeleton width="15%" height="20px" />
          <Skeleton width="15%" height="20px" />
        </div>
      ))}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div style={{ display: 'flex', gap: '1.5rem', padding: '1.5rem' }}>
      <div style={{ width: '280px', flexShrink: 0 }}>
        <Skeleton width="100%" height="50px" radius="14px" margin="0 0 1rem 0" />
        <Skeleton width="100%" height="40px" radius="10px" margin="0 0 0.5rem 0" />
        <Skeleton width="100%" height="40px" radius="10px" margin="0 0 0.5rem 0" />
        <Skeleton width="100%" height="40px" radius="10px" margin="0 0 0.5rem 0" />
        <Skeleton width="100%" height="40px" radius="10px" margin="0 0 0.5rem 0" />
      </div>
      <div style={{ flex: 1 }}>
        <Skeleton width="100%" height="120px" radius="20px" margin="0 0 1.5rem 0" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    </div>
  );
}

export default Skeleton;