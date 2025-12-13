interface WardStatus {
  ward_id: number;
  ward_name: string;
  status: 'green' | 'yellow' | 'red' | 'blue' | 'pink';
  signal_count: number;
  category_breakdown: {
    green: number;
    yellow: number;
    red: number;
    blue: number;
    pink: number;
  };
}

interface WardStatusTableProps {
  wardStatuses: WardStatus[];
}

export function WardStatusTable({ wardStatuses }: WardStatusTableProps) {
  const getStatusBadge = (status: string) => {
    const colors = {
      green: 'bg-ward-green',
      yellow: 'bg-ward-yellow',
      red: 'bg-ward-red',
      blue: 'bg-ward-blue',
      pink: 'bg-ward-pink',
    };
    const color = colors[status as keyof typeof colors] || 'bg-gray-300';

    return (
      <span
        className={`${color} text-white text-xs font-semibold px-2 py-1 rounded capitalize`}
      >
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-3">
      {wardStatuses.map((ward) => (
        <a
          key={ward.ward_id}
          href={`/ward/${ward.ward_id}`}
          className="block p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold">{ward.ward_name}</span>
            {getStatusBadge(ward.status)}
          </div>
          <div className="text-sm text-gray-600">
            {ward.signal_count} signals
          </div>
          <div className="flex gap-1 mt-2">
            {Object.entries(ward.category_breakdown || {}).map(([cat, count]) => (
              <div
                key={cat}
                className="text-xs bg-gray-100 px-2 py-1 rounded"
                title={`${cat}: ${count}`}
              >
                {cat[0].toUpperCase()}: {count}
              </div>
            ))}
          </div>
        </a>
      ))}
    </div>
  );
}
