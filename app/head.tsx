export default function Head() {
  return (
    <>
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      {/* Use Playfair Display for headings and Inter for body */}
      <link
        href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@300;400;600;700&display=swap"
        rel="stylesheet"
      />
      {/* Consider adding <link rel="preload"> for fonts if you self-host later */}
    </>
  )
}
