import { Link, Share2 } from 'lucide-react';
export default function ShareButtons({ title }: { title: string }) {
  const share = async () => {
    if (navigator.share) await navigator.share({ title, url: location.href });
    else await navigator.clipboard.writeText(location.href);
  };
  const copy = async () => navigator.clipboard.writeText(location.href);
  return (
    <div className="share-buttons">
      <button type="button" onClick={share}>
        <Share2 aria-hidden="true" />
        Share
      </button>
      <button type="button" onClick={copy}>
        <Link aria-hidden="true" />
        Copy link
      </button>
    </div>
  );
}
