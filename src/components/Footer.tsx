'use client';

import Link from 'next/link';
import React from 'react';

const PawIcon = () => (
  <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-hidden="true">
    <ellipse cx="8" cy="12" rx="3.2" ry="4.2" fill="currentColor" opacity=".9" />
    <ellipse cx="14.5" cy="8.5" rx="3" ry="4" fill="currentColor" opacity=".9" />
    <ellipse cx="21" cy="8.5" rx="3" ry="4" fill="currentColor" opacity=".9" />
    <ellipse cx="27" cy="12" rx="3.2" ry="4.2" fill="currentColor" opacity=".9" />
    <path d="M7 19.5c0-5 3.5-8.5 9-8.5s9 3.5 9 8.5c0 3.5-2 5.5-4.5 6.5-1.5.6-3 .5-4.5 0C13.5 24.5 7 23 7 19.5Z" fill="currentColor" />
  </svg>
);

const FacebookIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const InstagramIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
  </svg>
);

const MailIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);

const HeartIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style={{ display: 'inline', verticalAlign: 'middle' }}>
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer style={{
      background: 'var(--surface)',
      borderTop: '1px solid var(--line)',
      marginTop: 'auto',
    }}>
      {/* Top divider line with brand accent */}
      <div style={{
        height: '3px',
        background: 'linear-gradient(90deg, var(--lost) 0%, var(--brand) 50%, var(--adopt) 100%)',
        opacity: 0.7,
      }} />

      <div style={{
        maxWidth: '1120px',
        margin: '0 auto',
        padding: '48px 24px 32px',
      }}>
        {/* Main grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '40px 32px',
          marginBottom: '40px',
        }}>
          {/* Brand column */}
          <div style={{ gridColumn: 'span 1' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <span style={{ color: 'var(--brand)', lineHeight: 1 }}>
                <PawIcon />
              </span>
              <span style={{
                fontSize: '22px',
                fontWeight: 700,
                color: 'var(--ink)',
                letterSpacing: '-0.03em',
              }}>
                Pawtro
              </span>
            </div>
            <p style={{
              color: 'var(--ink-2)',
              fontSize: '13.5px',
              lineHeight: 1.7,
              maxWidth: '240px',
              margin: '0 0 20px',
            }}>
              বাংলাদেশে হারানো ও কুড়িয়ে পাওয়া পোষ্যের জন্য একটি সম্প্রদায়-চালিত প্ল্যাটফর্ম।
            </p>
            {/* Social links */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <a
                href="https://facebook.com/pawtrobd"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  border: '1px solid var(--line)',
                  color: 'var(--ink-2)',
                  background: 'var(--surface-2)',
                  transition: 'all 0.18s ease',
                  textDecoration: 'none',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLAnchorElement).style.background = 'var(--brand)';
                  (e.currentTarget as HTMLAnchorElement).style.color = '#fff';
                  (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--brand)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLAnchorElement).style.background = 'var(--surface-2)';
                  (e.currentTarget as HTMLAnchorElement).style.color = 'var(--ink-2)';
                  (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--line)';
                }}
              >
                <FacebookIcon />
              </a>
              <a
                href="https://instagram.com/pawtrobd"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  border: '1px solid var(--line)',
                  color: 'var(--ink-2)',
                  background: 'var(--surface-2)',
                  transition: 'all 0.18s ease',
                  textDecoration: 'none',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLAnchorElement).style.background = 'var(--brand)';
                  (e.currentTarget as HTMLAnchorElement).style.color = '#fff';
                  (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--brand)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLAnchorElement).style.background = 'var(--surface-2)';
                  (e.currentTarget as HTMLAnchorElement).style.color = 'var(--ink-2)';
                  (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--line)';
                }}
              >
                <InstagramIcon />
              </a>
            </div>
          </div>

          {/* Navigation column */}
          <div>
            <h3 style={{
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--ink-3)',
              marginBottom: '16px',
            }}>
              নেভিগেশন
            </h3>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { href: '/', label: 'হোমপেজ' },
                { href: '/adoption', label: 'দত্তক নিন' },
                { href: '/clinics', label: 'ভেটেরিনারি ক্লিনিক' },
                { href: '/rescue-teams', label: 'রেসকিউ টিম' },
                { href: '/post-pet', label: 'পোষ্য পোস্ট করুন' },
              ].map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  style={{
                    color: 'var(--ink-2)',
                    textDecoration: 'none',
                    fontSize: '14px',
                    transition: 'color 0.15s ease',
                    width: 'fit-content',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--brand)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--ink-2)')}
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Help column */}
          <div>
            <h3 style={{
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--ink-3)',
              marginBottom: '16px',
            }}>
              সহায়তা
            </h3>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { href: '/login', label: 'সাইন ইন / নিবন্ধন' },
                { href: '/dashboard', label: 'আমার ড্যাশবোর্ড' },
              ].map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  style={{
                    color: 'var(--ink-2)',
                    textDecoration: 'none',
                    fontSize: '14px',
                    transition: 'color 0.15s ease',
                    width: 'fit-content',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--brand)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--ink-2)')}
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Contact column */}
          <div>
            <h3 style={{
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--ink-3)',
              marginBottom: '16px',
            }}>
              যোগাযোগ
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <a
                href="mailto:pawtrobd@gmail.com"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: 'var(--ink-2)',
                  textDecoration: 'none',
                  fontSize: '14px',
                  transition: 'color 0.15s ease',
                  width: 'fit-content',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--brand)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--ink-2)')}
              >
                <MailIcon />
                pawtrobd@gmail.com
              </a>
              <p style={{
                color: 'var(--ink-3)',
                fontSize: '13px',
                lineHeight: 1.65,
                margin: 0,
              }}>
                সাধারণত ২৪ ঘণ্টার মধ্যে উত্তর দেওয়া হয়।
              </p>

              {/* Report urgent */}
              <div style={{
                marginTop: '4px',
                padding: '10px 14px',
                background: 'hsl(160 35% 96%)',
                border: '1px solid hsl(160 30% 88%)',
                borderRadius: '8px',
              }}
                className="footer-urgentbox"
              >
                <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--found)', fontWeight: 600, marginBottom: '2px' }}>
                  জরুরি পোষ্য উদ্ধার?
                </p>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--ink-2)', lineHeight: 1.5 }}>
                  সরাসরি ইমেইল করুন বা রেসকিউ টিম পেজ দেখুন।
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: '1px', background: 'var(--line)', marginBottom: '24px' }} />

        {/* Bottom bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--ink-3)' }}>
            © {year} Pawtro — সর্বস্বত্ব সংরক্ষিত।
          </p>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--ink-3)' }}>
            তৈরি করা হয়েছে <HeartIcon /> দিয়ে, বাংলাদেশের পোষ্যপ্রেমীদের জন্য।
          </p>
        </div>
      </div>

      <style>{`
        [data-theme="dark"] .footer-urgentbox {
          background: hsl(160 20% 14%);
          border-color: hsl(160 20% 22%);
        }
      `}</style>
    </footer>
  );
}
