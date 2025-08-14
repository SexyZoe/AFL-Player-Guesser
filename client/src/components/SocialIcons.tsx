import React, { useState } from 'react';
import QRCode from 'react-qr-code';

type SocialIconsProps = {
  githubUrl?: string;
  linkedinUrl?: string;
  qrUrl?: string;
  shareUrl?: string;
  shareTitle?: string;
  shareText?: string;
};

const GitHubIcon: React.FC = () => (
  <svg width="40" height="40" viewBox="71 71 370 370" aria-label="GitHub" role="img">
    <path d="M256 70.7c-102.6 0-185.9 83.2-185.9 185.9 0 82.1 53.3 151.8 127.1 176.4 9.3 1.7 12.3-4 12.3-8.9V389.4c-51.7 11.3-62.5-21.9-62.5-21.9 -8.4-21.5-20.6-27.2-20.6-27.2 -16.9-11.5 1.3-11.3 1.3-11.3 18.7 1.3 28.5 19.2 28.5 19.2 16.6 28.4 43.5 20.2 54.1 15.4 1.7-12 6.5-20.2 11.8-24.9 -41.3-4.7-84.7-20.6-84.7-91.9 0-20.3 7.3-36.9 19.2-49.9 -1.9-4.7-8.3-23.6 1.8-49.2 0 0 15.6-5 51.1 19.1 14.8-4.1 30.7-6.2 46.5-6.3 15.8 0.1 31.7 2.1 46.6 6.3 35.5-24 51.1-19.1 51.1-19.1 10.1 25.6 3.8 44.5 1.8 49.2 11.9 13 19.1 29.6 19.1 49.9 0 71.4-43.5 87.1-84.9 91.7 6.7 5.8 12.8 17.1 12.8 34.4 0 24.9 0 44.9 0 51 0 4.9 3 10.7 12.4 8.9 73.8-24.6 127-94.3 127-176.4C441.9 153.9 358.6 70.7 256 70.7z"/>
  </svg>
);

const LinkedInIcon: React.FC = () => (
  <svg width="40" height="40" viewBox="0 0 512 512" aria-label="LinkedIn" role="img">
    <path d="M186.4 142.4c0 19-15.3 34.5-34.2 34.5 -18.9 0-34.2-15.4-34.2-34.5 0-19 15.3-34.5 34.2-34.5C171.1 107.9 186.4 123.4 186.4 142.4zM181.4 201.3h-57.8V388.1h57.8V201.3zM273.8 201.3h-55.4V388.1h55.4c0 0 0-69.3 0-98 0-26.3 12.1-41.9 35.2-41.9 21.3 0 31.5 15 31.5 41.9 0 26.9 0 98 0 98h57.5c0 0 0-68.2 0-118.3 0-50-28.3-74.2-68-74.2 -39.6 0-56.3 30.9-56.3 30.9v-25.2H273.8z"/>
  </svg>
);

const QrIcon: React.FC = () => (
  <svg width="40" height="40" viewBox="0 0 192 192" aria-label="QR" role="img" xmlns="http://www.w3.org/2000/svg" fill="none">
    <path fill="#000000" d="M108 108h23.226Z"/>
    <path stroke="#000000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="12" d="M108 108h23.226"/>
    <path fill="#000000" d="M148.646 108H168Z"/>
    <path stroke="#000000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="12" d="M148.646 108H168"/>
    <path fill="#000000" d="M108 128h11.613Z"/>
    <path stroke="#000000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="12" d="M108 128h11.613"/>
    <path fill="#000000" d="M137.032 128H168Z"/>
    <path stroke="#000000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="12" d="M137.032 128H168"/>
    <path fill="#000000" d="M108 148h23.226Z"/>
    <path stroke="#000000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="12" d="M108 148h23.226"/>
    <path fill="#000000" d="M148.646 148H168Z"/>
    <path stroke="#000000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="12" d="M148.646 148H168"/>
    <path fill="#000000" d="M108 168h5.806Z"/>
    <path stroke="#000000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="12" d="M108 168h5.806"/>
    <path fill="#000000" d="M131.226 168H168Z"/>
    <path stroke="#000000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="12" d="M131.226 168H168"/>
    <rect width="62" height="62" x="22" y="22" stroke="#000000" strokeWidth="12" rx="10"/>
    <rect width="62" height="62" x="22" y="108" stroke="#000000" strokeWidth="12" rx="10"/>
    <rect width="62" height="62" x="108" y="22" stroke="#000000" strokeWidth="12" rx="10"/>
    <rect width="22" height="22" x="42" y="42" fill="#000000" rx="3"/>
    <rect width="22" height="22" x="42" y="128" fill="#000000" rx="3"/>
    <rect width="22" height="22" x="128" y="42" fill="#000000" rx="3"/>
  </svg>
);

const ShareIcon: React.FC = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Share" role="img">
    <path fillRule="evenodd" clipRule="evenodd" d="M19.6495 0.799565C18.4834 -0.72981 16.0093 0.081426 16.0093 1.99313V3.91272C12.2371 3.86807 9.65665 5.16473 7.9378 6.97554C6.10034 8.9113 5.34458 11.3314 5.02788 12.9862C4.86954 13.8135 5.41223 14.4138 5.98257 14.6211C6.52743 14.8191 7.25549 14.7343 7.74136 14.1789C9.12036 12.6027 11.7995 10.4028 16.0093 10.5464V13.0069C16.0093 14.9186 18.4834 15.7298 19.6495 14.2004L23.3933 9.29034C24.2022 8.2294 24.2022 6.7706 23.3933 5.70966L19.6495 0.799565ZM7.48201 11.6095C9.28721 10.0341 11.8785 8.55568 16.0093 8.55568H17.0207C17.5792 8.55568 18.0319 9.00103 18.0319 9.55037L18.0317 13.0069L21.7754 8.09678C22.0451 7.74313 22.0451 7.25687 21.7754 6.90322L18.0317 1.99313V4.90738C18.0317 5.4567 17.579 5.90201 17.0205 5.90201H16.0093C11.4593 5.90201 9.41596 8.33314 9.41596 8.33314C8.47524 9.32418 7.86984 10.502 7.48201 11.6095Z" fill="#0F0F0F"/>
    <path d="M7 1.00391H4C2.34315 1.00391 1 2.34705 1 4.00391V20.0039C1 21.6608 2.34315 23.0039 4 23.0039H20C21.6569 23.0039 23 21.6608 23 20.0039V17.0039C23 16.4516 22.5523 16.0039 22 16.0039C21.4477 16.0039 21 16.4516 21 17.0039V20.0039C21 20.5562 20.5523 21.0039 20 21.0039H4C3.44772 21.0039 3 20.5562 3 20.0039V4.00391C3 3.45162 3.44772 3.00391 4 3.00391H7C7.55228 3.00391 8 2.55619 8 2.00391C8 1.45162 7.55228 1.00391 7 1.00391Z" fill="#0F0F0F"/>
  </svg>
);

const SocialIcons: React.FC<SocialIconsProps> = ({
  githubUrl = 'https://github.com/your-github',
  linkedinUrl = 'https://www.linkedin.com/in/your-linkedin',
  qrUrl = 'https://guessfooty.up.railway.app/play',
  shareUrl,
  shareTitle,
  shareText
}) => {
  const [showQr, setShowQr] = useState(false);
  const shareLink = shareUrl || qrUrl;
  const shareTitleText = shareTitle || 'AFL Guess Who';
  const shareTextText = shareText || '来玩 AFL Guess Who！';

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: shareTitleText, text: shareTextText, url: shareLink });
        return;
      }
    } catch (e) {
      // 用户取消分享等情况，忽略
    }
    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        await navigator.clipboard.writeText(shareLink);
        alert('已复制链接，去社交软件或短信粘贴分享即可');
        return;
      }
    } catch {}
    window.prompt('复制此链接进行分享：', shareLink);
  };
  return (
    <div className="soc" style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
      <a href={githubUrl} target="_blank" rel="noopener noreferrer" className="icon github" title="GitHub">
        <GitHubIcon />
      </a>
      <a href={linkedinUrl} target="_blank" rel="noopener noreferrer" className="icon linkedin" title="LinkedIn">
        <LinkedInIcon />
      </a>
      <button
        onClick={() => setShowQr(true)}
        title="Scan QR to open site"
        aria-label="Show QR"
        style={{
          padding: 0,
          margin: 0,
          border: 'none',
          background: 'transparent',
          cursor: 'pointer'
        }}
      >
        <QrIcon />
      </button>

      <button
        onClick={handleShare}
        title="分享链接"
        aria-label="Share"
        style={{
          padding: 0,
          margin: 0,
          border: 'none',
          background: 'transparent',
          cursor: 'pointer'
        }}
      >
        <ShareIcon />
      </button>

      {showQr && (
        <div
          onClick={() => setShowQr(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff',
              borderRadius: 12,
              padding: 16,
              width: 280,
              boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
              textAlign: 'center'
            }}
          >
            <div style={{ padding: 8, background: '#fff', display: 'inline-block' }}>
              <QRCode value={qrUrl} size={220} fgColor="#000000" bgColor="#ffffff" />
            </div>
            <div style={{ marginTop: 8, wordBreak: 'break-all', fontSize: 12, color: '#555' }}>{qrUrl}</div>
            <button
              onClick={() => setShowQr(false)}
              style={{
                marginTop: 12,
                padding: '6px 10px',
                borderRadius: 6,
                border: '1px solid #ddd',
                background: '#f7f7f7',
                cursor: 'pointer'
              }}
            >
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SocialIcons;

