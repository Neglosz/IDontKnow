import './globals.css';

export const metadata = {
  title: 'เราสงสัย.exe — Shop Admin',
  description: 'จัดการไอเทมในร้านค้า',
};

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
