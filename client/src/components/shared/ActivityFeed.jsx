import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { activitiesApi } from '@/api/crm';
import { formatDate, timeAgo } from '@/lib/utils';
import { Phone, Email, Group, InsertDriveFile, DesktopMac, ArrowForward, Add } from '@mui/icons-material';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

const ICONS = { call: Phone, email: Email, meeting: Group, note: InsertDriveFile, demo: DesktopMac, follow_up: ArrowForward };
const COLORS = {
  call: 'bg-blue-100 text-blue-600',
  email: 'bg-green-100 text-green-600',
  meeting: 'bg-purple-100 text-purple-600',
  note: 'bg-gray-100 text-gray-600',
  demo: 'bg-yellow-100 text-yellow-600',
  follow_up: 'bg-orange-100 text-orange-600',
};

export function ActivityFeed({ relatedModel, relatedId }) {
  const { data, isLoading } = useQuery({
    queryKey: ['activities', relatedModel, relatedId],
    queryFn: () => activitiesApi.list({ relatedModel, relatedId }),
  });

  if (isLoading) return <div className="text-sm text-muted-foreground py-4">Loading activities...</div>;

  const activities = data?.data || [];

  return (
    <div className="space-y-3">
      {activities.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">No activities yet</p>
      ) : (
        activities.map(a => {
          const Icon = ICONS[a.type] || InsertDriveFile;
          return (
            <div key={a._id} className="flex gap-3">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${COLORS[a.type] || COLORS.note}`}>
                <Icon className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-sm font-medium capitalize">{a.type.replace('_', ' ')}</p>
                  <p className="text-xs text-muted-foreground flex-shrink-0">{timeAgo(a.date)}</p>
                </div>
                {a.notes && <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{a.notes}</p>}
                {a.outcome && <p className="text-xs text-green-600 mt-0.5">Outcome: {a.outcome}</p>}
                <p className="text-xs text-muted-foreground mt-0.5">by {a.createdBy?.name}</p>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
