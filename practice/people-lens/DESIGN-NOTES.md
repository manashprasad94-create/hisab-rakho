# People Lens design notes

People Lens is a standalone Android-browser learning tool. Its visual source is
the repository's [Ink & Marigold design system](../../DESIGN.md). This document
records the practice app as implemented; it does not redefine the main product.

## Inherited identity

- Self-hosted Manrope, with system sans-serif fallback.
- Ink `#203047` for primary buttons, branding, and the preview shell; deeper ink
  `#162438` for hover feedback and the image stage.
- Marigold `#F2BE49` for person boxes, labels, and the current count. Detection
  labels use ink text on marigold. The practice badge uses pale `#FFF5D8`.
- Paper `#F4F5F2`, white controls, main text `#202A35`, muted text `#5D6872`,
  dividers `#D8DED8`, and control borders `#84919A`.
- Status panels use success green `#176548` on `#EAF4EE` and explicit error text
  in `#AD3545` on `#FCEEF0`. Status meaning is always written out.
- Flat surfaces, quiet dividers, restrained rounded corners, and tabular count,
  confidence, and timing values.

## Composition and controls

The desktop working area is capped at 1160px, with a flexible preview and 310px
settings column separated by 32px. At 760px and below it becomes one column with
20px gutters. The full-width preview uses a portrait stage capped at 60vh on
mobile. Start and Stop stay in a fixed bottom action bar with safe-area padding;
the page reserves bottom space for that bar.

The preview shows the exact analysed frame, with letterboxing where needed,
rather than putting old boxes over a newer live feed. Its header identifies the
mode and processing device. Its footer reports people in the current frame and
round-trip time. The app does not present that count as unique visitors.

Settings include a required password-style pairing-code field, front/back camera
selection, and a 10–90% confidence slider in 5-point increments, initially 40%.
A labelled photo input offers a camera-free test. A short disclosure explains the
phone-to-laptop processing flow and that frames are not saved.

Practice-specific sizing currently differs from some shared component tokens:
controls use 10px corners and a 46px minimum height, the preview uses 16px
corners, and the headline scales from 27px to 42px. The confidence slider is
30px high. The mobile practice badge is 10px. Disabled buttons use reduced
opacity. Keyboard focus uses a visible 3px amber outline. These describe current
CSS choices, not new shared design-system defaults.

## Interaction states

- **Initial / ready:** explanatory empty preview, count shown as a dash, device
  health check, and guidance to enter the laptop pairing code.
- **Requesting access:** status explains the camera request; Start, camera
  selection, and photo input are disabled while Stop remains available.
- **Analysing camera:** labelled person boxes, current count, device name,
  processing time, and round-trip time. Confidence remains adjustable.
- **Analysing photo:** temporary progress text followed by the annotated image
  and an explicit photo mode label.
- **Stopped / backgrounded:** tracks stop, pending transport is aborted, the
  empty preview returns, and controls become available for a fresh run.
- **Error:** readable recovery guidance covers permissions, unavailable/busy
  camera, insecure origins, pairing failure, and transport/inference problems.

Form labels, native buttons and inputs, a polite live status region, and visible
keyboard focus support accessibility. No decorative animation is used.

## Verification boundary

The parent implementation review inspected a 390×844 mobile screenshot and
confirmed the full-width preview and fixed action bar. Six HTTP transport tests
passed in the parent implementation run. The independent review reran all three
JavaScript regression tests successfully: cancelling pending camera permission
and restarting, explaining insecure origins, and preventing a cancelled playback
promise from updating a newer run. The playback fixture waits for its deferred
callback before simulating cancellation. Real Android camera,
HTTPS/USB connectivity, GPU inference, and detection accuracy require hardware
verification; visual review and stubbed tests do not establish those outcomes.
