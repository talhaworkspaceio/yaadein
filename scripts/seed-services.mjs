import { getPayload } from 'payload'
import configPromise from '../payload.config.js'

const INITIAL_SERVICES = [
  {
    title: 'Instagram Mirror Selfie Frame',
    slug: 'instagram-mirror-selfie',
    tagline: 'Viral Interactive Selfie Mirror',
    shortDesc: 'Transform your space with a custom-crafted Instagram Reel & Post mirror frame. Complete with personalized handle, verified badge, likes count, custom audio title, and high-clarity HD mirror center for unforgettable selfies.',
    detailedText: 'Take your selfie game and interior decor to the next level with our handcrafted Instagram Mirror Selfie Frame. Designed to replicate an authentic Instagram Reel UI complete with your custom handle, blue verified checkmark, custom audio name, and engagement stats. Featuring a high-definition shatterproof mirror at its center, this frame turns everyday mirror selfies into viral social media moments. It is tailor-made for cafes, fashion boutiques, photo studios, and modern bedrooms looking to add a stylish, interactive aesthetic centerpiece.',
    priceInfo: 'Custom mirror frames start from Rs. 4,999 depending on size and acrylic finishes.',
    imageUrl: '/images/instagram_mirror_selfie.jpg',
    features: [
      { featureText: 'Custom engraved Instagram Reel UI (Username, verified badge & audio)' },
      { featureText: 'High-definition shatterproof studio acrylic mirror' },
      { featureText: 'Interactive social stats: Likes, Comments, Shares & Bookmarks' },
      { featureText: 'Perfect aesthetic focal point for cafés, boutiques, studios & bedrooms' },
      { featureText: 'Includes solid wood back support and heavy-duty wall mounting hardware' },
    ],
    ctaText: 'Customize & Order Mirror',
    ctaLink: '/contact',
  },
  {
    title: 'Nikkah Nama Framing',
    slug: 'nikkahnama-framing',
    tagline: 'Preserve Your Sacred Bond',
    shortDesc: 'Preserve the most sacred contract of your life in a premium handcrafted frame. We specialize in archival-grade Nikkah Nama framing, utilizing acid-free mounts and museum glass to ensure your signature bond stays protected and visually stunning for generations.',
    detailedText: 'Your Nikkah Nama is more than just a document — it is the celebration of a sacred vow. Our specialized Nikkah Nama framing service ensures this precious heirloom is protected from aging, moisture, and sunlight. We use 100% acid-free mats to prevent discoloration, and offer museum-grade conservation glass that blocks 99% of harmful UV rays. Each frame is custom-built by hand to perfectly match the size and aesthetic of your contract, completed with elegant gold accents and double matting for a truly royal look.',
    priceInfo: 'Framing starts from Rs. 4,000 depending on dimensions and wood selection.',
    imageUrl: '/images/nikkahnama_images/sample1.jpeg',
    features: [
      { featureText: 'Custom-fit double mounting with elegant gold borders' },
      { featureText: '99% UV-protection museum glass options' },
      { featureText: 'Selection of premium local and imported wood trims' },
      { featureText: 'Dust and humidity-controlled rear framing seal' },
      { featureText: 'Includes premium hanging hardware and mounting wire' },
    ],
    ctaText: 'Upload & Frame Nikkah Nama',
    ctaLink: '/contact',
  },
  {
    title: 'Old Photo Restoration',
    slug: 'photo-restoration',
    tagline: 'Bring Memories Back to Life',
    shortDesc: 'Bring your damaged, faded, or torn family photographs back to life. Our digital restoration specialists repair cracks, restore lost colors, and upscale resolutions for printing.',
    detailedText: 'Every photograph is a window to a moment in time, but physical prints degrade, fade, and tear. Our professional restoration service carefully reconstructs your cherished images pixel by pixel. We remove scratches, fix cracks, balance faded colors, and can even colorize monochrome photos to make them feel alive today. Combining state-of-the-art AI upscaling with meticulous digital painting, we ensure that the final result looks completely natural while retaining the vintage soul of the original capture.',
    priceInfo: 'Restorations start from Rs. 1,499 per photo depending on level of damage.',
    imageUrl: '/images/photo_restoration.png',
    features: [
      { featureText: 'Scratch, crease, and tear removal' },
      { featureText: 'Advanced AI colorization of black & white photos' },
      { featureText: 'High-fidelity upscaling and detail sharpening' },
      { featureText: 'Digital delivery + premium printing options' },
      { featureText: 'Water damage and stain reconstruction' },
    ],
    ctaText: 'Upload Image for Quote',
    ctaLink: '/contact',
  },
  {
    title: 'Photo Editing Service',
    slug: 'photo-editing',
    tagline: 'Professional Digital Retouching',
    shortDesc: 'Enhance, retouch, and transform your digital photos before printing and framing. Whether you need background removal, beauty retouching, object removal, or professional color grading, our digital artists prepare your images to look their absolute best.',
    detailedText: 'Make every photo a masterpiece before it goes on your wall. Our professional digital editing service covers everything from subtle enhancements to major manipulations. Our skilled artists carefully adjust colors, exposure, and composition to give your photos a cinematic quality. We can remove distracting elements in the background, blend multiple photos, perform high-end skin and portrait retouching, and upscale lower resolution files so they print beautifully at larger sizes.',
    priceInfo: 'Edits start from Rs. 1,000 per photo depending on level of retouching.',
    imageUrl: '/images/restoration/child_after.png',
    features: [
      { featureText: 'Professional beauty retouching and skin correction' },
      { featureText: 'Background replacement and unwanted object removal' },
      { featureText: 'Cinematic color grading and lighting adjustments' },
      { featureText: 'High-resolution sharpening and upscaling' },
      { featureText: 'Object manipulation and custom creative edits' },
    ],
    ctaText: 'Upload Image for Editing',
    ctaLink: '/contact',
  },
  {
    title: 'Bespoke Picture Framing',
    slug: 'bespoke-framing',
    tagline: 'Handcrafted To Perfection',
    shortDesc: 'Every frame is individually built by hand in our local workshop. We select high-grade local wood, cure it to prevent warping, and shape it with premium moulding profiles.',
    detailedText: "Our bespoke picture framing service is designed for those who appreciate the finer details. We don't believe in mass production. Each frame begins as raw lumber, which is carefully selected for grain consistency and strength. We cure the wood to ensure it will never warp or crack, even in humid climates. Our artisans then mill, join, and finish the frames using traditional techniques passed down through generations.",
    priceInfo: 'Pricing starts from Rs. 2,500 depending on dimensions and wood selection.',
    imageUrl: '/images/bespoke_framing.png',
    features: [
      { featureText: 'Solid cured local pine, walnut, and oak mouldings' },
      { featureText: 'Acid-free double mounting mats (matboards) to protect artwork' },
      { featureText: 'Premium scratch-resistant acrylic and conservation glass choices' },
      { featureText: 'Individually hand-assembled and quality-tested in our studio' },
    ],
    ctaText: 'Launch Studio Builder',
    ctaLink: '/customize',
  },
  {
    title: 'Giclée Fine Art Printing',
    slug: 'fine-art-printing',
    tagline: 'Archival Quality Prints',
    shortDesc: 'Send us your digital images. We print on museum-grade canvas or fine-textured paper using professional wide-format pigment plotters. Colors are perfectly calibrated.',
    detailedText: 'Transform your digital files into breathtaking tangible art. Our Giclée printing service utilizes museum-grade plotters with 12-color pigment-based ink systems. Unlike standard laser or inkjet prints, Giclée prints offer exceptional color depth, smooth gradients, and fade-resistance that lasts for over a century.',
    priceInfo: 'Printing starts from Rs. 1,200 depending on size and media type.',
    imageUrl: '/images/fine_art_printing.png',
    features: [
      { featureText: 'Archival 380gsm matte cotton canvas' },
      { featureText: '12-color Lucia PRO pigment inks (fade-proof for 100+ years)' },
      { featureText: 'Digital color grading & image resolution upscaling' },
    ],
    ctaText: 'Upload & Print Image',
    ctaLink: '/catalog',
  },
  {
    title: 'Gallery Wall Layouts',
    slug: 'gallery-walls',
    tagline: 'Curated Space Design',
    shortDesc: 'Have a blank staircase, hallway, or living space? We design curated collections of frames that fit together in complete harmony to reflect your personal memories.',
    detailedText: 'A gallery wall is more than just a collection of pictures; it is a visual narrative of your life, travel, and tastes. Designing one can be overwhelming—which is why our experts are here to help. We analyze your wall dimensions, furniture placement, and lighting to design a perfectly balanced layout.',
    priceInfo: 'Custom consultations start from Rs. 5,000 including blueprints.',
    imageUrl: '/images/gallery_walls.png',
    features: [
      { featureText: 'Custom multi-frame spacing blueprints and 3D renders' },
      { featureText: 'Virtual render previews for your specific walls' },
      { featureText: 'Includes absolute life-sized wall-hanging paper templates' },
    ],
    ctaText: 'Consult Designer',
    ctaLink: '/contact',
  },
]

async function runSeed() {
  console.log('🌱 Initializing Payload CMS and Seeding Services...')
  const payload = await getPayload({ config: configPromise })

  for (const s of INITIAL_SERVICES) {
    const existing = await payload.find({
      collection: 'services',
      where: {
        slug: { equals: s.slug },
      },
    })

    if (existing.docs && existing.docs.length > 0) {
      console.log(`✅ Updating existing service: ${s.title} (${s.slug})`)
      await payload.update({
        collection: 'services',
        id: existing.docs[0].id,
        data: s,
      })
    } else {
      console.log(`✨ Creating new service in CMS: ${s.title} (${s.slug})`)
      await payload.create({
        collection: 'services',
        data: s,
      })
    }
  }

  console.log('🎉 All 7 Services successfully seeded into Payload CMS!')
  process.exit(0)
}

runSeed().catch((err) => {
  console.error('❌ Error seeding services:', err)
  process.exit(1)
})
