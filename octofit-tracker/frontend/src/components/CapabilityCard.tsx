import { useEffect, useState, type ReactNode } from 'react';
import { getJson } from '../api/client.js';

type Props = { title: string; description: string };
type AsyncProps<T> = Props & {
  endpoint: string;
  emptyMessage: string;
  isEmpty: (data: T) => boolean;
  renderData: (data: T) => ReactNode;
};

export function CapabilityCard<T>({ title, description, endpoint, emptyMessage, isEmpty, renderData }: AsyncProps<T>) {
  const [data, setData] = useState<T>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(undefined);
    getJson<T>(endpoint)
      .then((result) => {
        if (active) setData(result);
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : String(cause));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [endpoint]);

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">{title}</h2>
        <p>{description}</p>
        {loading && <p role="status">Loading {title.toLowerCase()}...</p>}
        {!loading && error && <p role="alert">Unable to load {title.toLowerCase()}: {error}</p>}
        {!loading && !error && data !== undefined && (
          isEmpty(data) ? <p>{emptyMessage}</p> : renderData(data)
        )}
      </div>
    </section>
  );
}
