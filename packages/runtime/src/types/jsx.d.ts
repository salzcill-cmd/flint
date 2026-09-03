// Flint Runtime — JSX Type Declarations
// Comprehensive TypeScript JSX types for Flint components

declare global {
  namespace JSX {
    type Element = any
    type ElementClass = any
    type ElementChildrenAttribute = {}
    type ElementAttributesProperty = {}

    interface IntrinsicElements {
      // HTML Elements
      a: HTMLAnchorAttributes
      abbr: HTMLAttributes
      address: HTMLAttributes
      area: HTMLAreaAttributes
      article: HTMLAttributes
      aside: HTMLAttributes
      audio: HTMLAudioAttributes
      b: HTMLAttributes
      base: HTMLBaseAttributes
      bdi: HTMLAttributes
      bdo: HTMLAttributes
      blockquote: HTMLBlockquoteAttributes
      body: HTMLAttributes
      br: HTMLAttributes
      button: HTMLButtonAttributes
      canvas: HTMLCanvasAttributes
      caption: HTMLAttributes
      cite: HTMLAttributes
      code: HTMLAttributes
      col: HTMLTableColAttributes
      colgroup: HTMLTableColAttributes
      data: HTMLDataAttributes
      datalist: HTMLAttributes
      dd: HTMLAttributes
      del: HTMLModAttributes
      details: HTMLDetailsAttributes
      dfn: HTMLAttributes
      dialog: HTMLDialogAttributes
      div: HTMLAttributes
      dl: HTMLAttributes
      dt: HTMLAttributes
      em: HTMLAttributes
      embed: HTMLEmbedAttributes
      fieldset: HTMLFieldSetAttributes
      figcaption: HTMLAttributes
      figure: HTMLAttributes
      footer: HTMLAttributes
      form: HTMLFormAttributes
      h1: HTMLAttributes
      h2: HTMLAttributes
      h3: HTMLAttributes
      h4: HTMLAttributes
      h5: HTMLAttributes
      h6: HTMLAttributes
      head: HTMLAttributes
      header: HTMLAttributes
      hr: HTMLAttributes
      html: HTMLHtmlAttributes
      i: HTMLAttributes
      iframe: HTMLIFrameAttributes
      img: HTMLImgAttributes
      input: HTMLInputAttributes
      ins: HTMLModAttributes
      kbd: HTMLAttributes
      label: HTMLLabelAttributes
      legend: HTMLAttributes
      li: HTMLLiAttributes
      link: HTMLLinkAttributes
      main: HTMLAttributes
      map: HTMLMapAttributes
      mark: HTMLAttributes
      menu: HTMLAttributes
      meta: HTMLMetaAttributes
      meter: HTMLMeterAttributes
      nav: HTMLAttributes
      noscript: HTMLAttributes
      object: HTMLObjectAttributes
      ol: HTMLOlAttributes
      optgroup: HTMLOptGroupAttributes
      option: HTMLOptionAttributes
      output: HTMLOutputAttributes
      p: HTMLAttributes
      param: HTMLParamAttributes
      picture: HTMLAttributes
      pre: HTMLAttributes
      progress: HTMLProgressAttributes
      q: HTMLQuoteAttributes
      rp: HTMLAttributes
      rt: HTMLAttributes
      ruby: HTMLAttributes
      s: HTMLAttributes
      samp: HTMLAttributes
      script: HTMLScriptAttributes
      section: HTMLAttributes
      select: HTMLSelectAttributes
      slot: HTMLSlotAttributes
      small: HTMLAttributes
      source: HTMLSourceAttributes
      span: HTMLAttributes
      strong: HTMLAttributes
      style: HTMLStyleAttributes
      sub: HTMLAttributes
      summary: HTMLAttributes
      sup: HTMLAttributes
      table: HTMLAttributes
      tbody: HTMLAttributes
      td: HTMLTdAttributes
      template: HTMLAttributes
      textarea: HTMLTextareaAttributes
      tfoot: HTMLAttributes
      th: HTMLThAttributes
      thead: HTMLAttributes
      time: HTMLTimeAttributes
      title: HTMLAttributes
      tr: HTMLAttributes
      track: HTMLTrackAttributes
      u: HTMLAttributes
      ul: HTMLAttributes
      var: HTMLAttributes
      video: HTMLVideoAttributes
      wbr: HTMLAttributes

      // SVG Elements
      svg: SVGAttributes
      circle: SVGAttributes
      clipPath: SVGAttributes
      defs: SVGAttributes
      ellipse: SVGAttributes
      feBlend: SVGAttributes
      feColorMatrix: SVGAttributes
      feComponentTransfer: SVGAttributes
      feComposite: SVGAttributes
      feConvolveMatrix: SVGAttributes
      feDiffuseLighting: SVGAttributes
      feDisplacementMap: SVGAttributes
      feDistantLight: SVGAttributes
      feDropShadow: SVGAttributes
      feFlood: SVGAttributes
      feFuncA: SVGAttributes
      feFuncB: SVGAttributes
      feFuncG: SVGAttributes
      feFuncR: SVGAttributes
      feGaussianBlur: SVGAttributes
      feImage: SVGAttributes
      feMerge: SVGAttributes
      feMergeNode: SVGAttributes
      feMorphology: SVGAttributes
      feOffset: SVGAttributes
      fePointLight: SVGAttributes
      feSpecularLighting: SVGAttributes
      feSpotLight: SVGAttributes
      feTile: SVGAttributes
      feTurbulence: SVGAttributes
      filter: SVGAttributes
      foreignObject: SVGAttributes
      g: SVGAttributes
      image: SVGAttributes
      line: SVGAttributes
      linearGradient: SVGAttributes
      marker: SVGAttributes
      mask: SVGAttributes
      metadata: SVGAttributes
      path: SVGAttributes
      pattern: SVGAttributes
      polygon: SVGAttributes
      polyline: SVGAttributes
      radialGradient: SVGAttributes
      rect: SVGAttributes
      stop: SVGAttributes
      switch: SVGAttributes
      symbol: SVGAttributes
      text: SVGAttributes
      textPath: SVGAttributes
      tspan: SVGAttributes
      use: SVGAttributes

      // Custom Elements
      [tag: string]: any
    }

    interface IntrinsicAttributes {
      key?: string | number
    }
  }

  // Event Types
  interface FlintEvent<T = Event> {
    target: EventTarget & T
    currentTarget: EventTarget & T
    preventDefault(): void
    stopPropagation(): void
    stopImmediatePropagation(): void
    timeStamp: number
    type: string
  }

  // Base HTML Attributes
  interface HTMLAttributes {
    // Core
    className?: string
    class?: string
    id?: string
    style?: string | CSSStyleDeclaration
    title?: string
    hidden?: boolean
    tabIndex?: number
    accessKey?: string
    contentEditable?: boolean | 'true' | 'false' | 'inherit'
    dir?: 'ltr' | 'rtl' | 'auto'
    draggable?: boolean
    lang?: string
    spellCheck?: boolean
    translate?: 'yes' | 'no'

    // Data Attributes
    data?: Record<string, string>

    // ARIA Attributes
    role?: string
    ariaLabel?: string
    ariaLabelledBy?: string
    ariaDescribedBy?: string
    ariaHidden?: boolean | 'true' | 'false'
    ariaExpanded?: boolean
    ariaSelected?: boolean
    ariaChecked?: boolean | 'mixed'
    ariaDisabled?: boolean
    ariaRequired?: boolean
    ariaInvalid?: boolean
    ariaLive?: 'off' | 'assertive' | 'polite'
    ariaAtomic?: boolean
    ariaRelevant?: string
    ariaCurrent?: string

    // Event Handlers
    onClick?: (e: FlintEvent<MouseEvent>) => void
    onDblClick?: (e: FlintEvent<MouseEvent>) => void
    onMouseDown?: (e: FlintEvent<MouseEvent>) => void
    onMouseUp?: (e: FlintEvent<MouseEvent>) => void
    onMouseEnter?: (e: FlintEvent<MouseEvent>) => void
    onMouseLeave?: (e: FlintEvent<MouseEvent>) => void
    onMouseMove?: (e: FlintEvent<MouseEvent>) => void
    onMouseOver?: (e: FlintEvent<MouseEvent>) => void
    onMouseOut?: (e: FlintEvent<MouseEvent>) => void
    onKeyDown?: (e: FlintEvent<KeyboardEvent>) => void
    onKeyUp?: (e: FlintEvent<KeyboardEvent>) => void
    onKeyPress?: (e: FlintEvent<KeyboardEvent>) => void
    onFocus?: (e: FlintEvent<FocusEvent>) => void
    onBlur?: (e: FlintEvent<FocusEvent>) => void
    onChange?: (e: FlintEvent<Event>) => void
    onInput?: (e: FlintEvent<Event>) => void
    onSubmit?: (e: FlintEvent<Event>) => void
    onReset?: (e: FlintEvent<Event>) => void
    onScroll?: (e: FlintEvent<Event>) => void
    onWheel?: (e: FlintEvent<WheelEvent>) => void
    onCopy?: (e: FlintEvent<ClipboardEvent>) => void
    onCut?: (e: FlintEvent<ClipboardEvent>) => void
    onPaste?: (e: FlintEvent<ClipboardEvent>) => void
    onDrag?: (e: FlintEvent<DragEvent>) => void
    onDragEnd?: (e: FlintEvent<DragEvent>) => void
    onDragEnter?: (e: FlintEvent<DragEvent>) => void
    onDragLeave?: (e: FlintEvent<DragEvent>) => void
    onDragOver?: (e: FlintEvent<DragEvent>) => void
    onDragStart?: (e: FlintEvent<DragEvent>) => void
    onDrop?: (e: FlintEvent<DragEvent>) => void
    onTouchStart?: (e: FlintEvent<TouchEvent>) => void
    onTouchMove?: (e: FlintEvent<TouchEvent>) => void
    onTouchEnd?: (e: FlintEvent<TouchEvent>) => void
    onTouchCancel?: (e: FlintEvent<TouchEvent>) => void
    onPointerDown?: (e: FlintEvent<PointerEvent>) => void
    onPointerUp?: (e: FlintEvent<PointerEvent>) => void
    onPointerMove?: (e: FlintEvent<PointerEvent>) => void
    onPointerEnter?: (e: FlintEvent<PointerEvent>) => void
    onPointerLeave?: (e: FlintEvent<PointerEvent>) => void
    onPointerOver?: (e: FlintEvent<PointerEvent>) => void
    onPointerOut?: (e: FlintEvent<PointerEvent>) => void
    onContextMenu?: (e: FlintEvent<MouseEvent>) => void

    // Slot
    children?: any
    ref?: { current: any } | ((el: any) => void)
  }

  // Input Attributes
  interface HTMLInputAttributes extends HTMLAttributes {
    type?: string
    name?: string
    value?: string | number | readonly string[]
    defaultValue?: string | number
    checked?: boolean
    defaultChecked?: boolean
    disabled?: boolean
    placeholder?: string
    required?: boolean
    readOnly?: boolean
    autoFocus?: boolean
    autoComplete?: string
    autoCorrect?: string
    autoCapitalize?: string
    autoSave?: string
    form?: string
    formAction?: string
    formEncType?: string
    formMethod?: string
    formNoValidate?: boolean
    formTarget?: string
    list?: string
    min?: number | string
    max?: number | string
    minLength?: number
    maxLength?: number
    multiple?: boolean
    pattern?: string
    step?: number | string
    accept?: string
    alt?: string
    capture?: boolean | 'user' | 'environment'
    src?: string
    srcSet?: string
    sizes?: string
    inputMode?: 'none' | 'text' | 'decimal' | 'numeric' | 'tel' | 'search' | 'email' | 'url'
    is?: string
  }

  // Button Attributes
  interface HTMLButtonAttributes extends HTMLAttributes {
    type?: 'submit' | 'reset' | 'button'
    name?: string
    value?: string
    disabled?: boolean
    form?: string
    formAction?: string
    formEncType?: string
    formMethod?: string
    formNoValidate?: boolean
    formTarget?: string
  }

  // Anchor Attributes
  interface HTMLAnchorAttributes extends HTMLAttributes {
    href?: string
    target?: '_self' | '_blank' | '_parent' | '_top' | string
    download?: any
    hrefLang?: string
    ping?: string
    rel?: string
    type?: string
    referrerPolicy?: string
  }

  // Form Attributes
  interface HTMLFormAttributes extends HTMLAttributes {
    action?: string
    encType?: 'application/x-www-form-urlencoded' | 'multipart/form-data' | 'text/plain'
    method?: 'get' | 'post' | 'dialog' | string
    name?: string
    noValidate?: boolean
    target?: string
    autoComplete?: string
  }

  // Select Attributes
  interface HTMLSelectAttributes extends HTMLAttributes {
    name?: string
    value?: string | number | readonly string[]
    defaultValue?: string | number
    multiple?: boolean
    size?: number
    disabled?: boolean
    required?: boolean
    autoFocus?: boolean
    form?: string
    autoComplete?: string
  }

  // Textarea Attributes
  interface HTMLTextareaAttributes extends HTMLAttributes {
    name?: string
    value?: string | number
    defaultValue?: string | number
    placeholder?: string
    rows?: number
    cols?: number
    wrap?: 'hard' | 'soft'
    disabled?: boolean
    readOnly?: boolean
    required?: boolean
    autoFocus?: boolean
    form?: string
    maxLength?: number
    minLength?: number
    autoComplete?: string
    autoCorrect?: string
    autoCapitalize?: string
  }

  // Img Attributes
  interface HTMLImgAttributes extends HTMLAttributes {
    alt?: string
    src?: string
    srcSet?: string
    sizes?: string
    crossOrigin?: 'anonymous' | 'use-credentials' | ''
    decoding?: 'async' | 'auto' | 'sync'
    loading?: 'eager' | 'lazy'
    width?: number | string
    height?: number | string
    fetchPriority?: 'high' | 'low' | 'auto'
    isMap?: boolean
    useMap?: string
    referrerPolicy?: string
  }

  // CSS Style Declaration (subset)
  interface CSSStyleDeclaration {
    [key: string]: string | number | undefined
    alignContent?: string
    alignItems?: string
    alignSelf?: string
    animation?: string
    background?: string
    backgroundColor?: string
    backgroundImage?: string
    border?: string
    borderBottom?: string
    borderColor?: string
    borderRadius?: string
    borderTop?: string
    boxShadow?: string
    color?: string
    cursor?: string
    display?: string
    flex?: string
    flexDirection?: string
    fontSize?: string
    fontWeight?: string
    height?: string | number
    justifyContent?: string
    letterSpacing?: string
    lineHeight?: string | number
    margin?: string | number
    maxHeight?: string | number
    maxWidth?: string | number
    minHeight?: string | number
    minWidth?: string | number
    opacity?: string | number
    outline?: string
    overflow?: string
    padding?: string | number
    position?: string
    textAlign?: string
    textDecoration?: string
    textOverflow?: string
    textShadow?: string
    transform?: string
    transition?: string
    whiteSpace?: string
    width?: string | number
    wordBreak?: string
    zIndex?: number | string
  }

  // SVG Attributes (subset)
  interface SVGAttributes extends HTMLAttributes {
    viewBox?: string
    xmlns?: string
    fill?: string
    stroke?: string
    strokeWidth?: number | string
    strokeLinecap?: string
    strokeLinejoin?: string
    strokeDasharray?: string | number
    strokeDashoffset?: string | number
    strokeMiterlimit?: number | string
    strokeOpacity?: number | string
    fillOpacity?: number | string
    fillRule?: 'nonzero' | 'evenodd'
    clipPath?: string
    clipRule?: 'nonzero' | 'evenodd'
    d?: string
    cx?: number | string
    cy?: number | string
    r?: number | string
    rx?: number | string
    ry?: number | string
    x?: number | string
    y?: number | string
    x1?: number | string
    y1?: number | string
    x2?: number | string
    y2?: number | string
    width?: number | string
    height?: number | string
    transform?: string
    points?: string
    pathLength?: number | string
    preserveAspectRatio?: string
    textAnchor?: string
    dominantBaseline?: string
    fontFamily?: string
    fontSize?: number | string
    fontWeight?: number | string
  }

  // Additional HTML element-specific attributes
  interface HTMLAreaAttributes extends HTMLAttributes {
    alt?: string
    coords?: string
    download?: any
    href?: string
    hrefLang?: string
    ping?: string
    rel?: string
    shape?: 'rect' | 'circle' | 'poly' | 'default'
    target?: string
  }

  interface HTMLAudioAttributes extends HTMLAttributes {
    autoPlay?: boolean
    controls?: boolean
    loop?: boolean
    muted?: boolean
    preload?: 'auto' | 'metadata' | 'none'
    src?: string
  }

  interface HTMLBaseAttributes extends HTMLAttributes {
    href?: string
    target?: string
  }

  interface HTMLBlockquoteAttributes extends HTMLAttributes {
    cite?: string
  }

  interface HTMLCanvasAttributes extends HTMLAttributes {
    width?: number | string
    height?: number | string
  }

  interface HTMLDataAttributes extends HTMLAttributes {
    value?: string | number
  }

  interface HTMLDetailsAttributes extends HTMLAttributes {
    open?: boolean
  }

  interface HTMLDialogAttributes extends HTMLAttributes {
    open?: boolean
  }

  interface HTMLEmbedAttributes extends HTMLAttributes {
    type?: string
    src?: string
    width?: number | string
    height?: number | string
  }

  interface HTMLFieldSetAttributes extends HTMLAttributes {
    disabled?: boolean
    form?: string
    name?: string
  }

  interface HTMLHtmlAttributes extends HTMLAttributes {
    manifest?: string
  }

  interface HTMLIFrameAttributes extends HTMLAttributes {
    src?: string
    srcDoc?: string
    name?: string
    sandbox?: string
    allow?: string
    allowFullScreen?: boolean
    width?: number | string
    height?: number | string
    referrerPolicy?: string
    loading?: 'eager' | 'lazy'
  }

  interface HTMLLabelAttributes extends HTMLAttributes {
    form?: string
    htmlFor?: string
  }

  interface HTMLLiAttributes extends HTMLAttributes {
    value?: number
  }

  interface HTMLLinkAttributes extends HTMLAttributes {
    href?: string
    rel?: string
    type?: string
    media?: string
    integrity?: string
    crossOrigin?: 'anonymous' | 'use-credentials' | ''
  }

  interface HTMLMapAttributes extends HTMLAttributes {
    name?: string
  }

  interface HTMLMetaAttributes extends HTMLAttributes {
    charSet?: string
    content?: string
    httpEquiv?: string
    name?: string
  }

  interface HTMLMeterAttributes extends HTMLAttributes {
    value?: number
    min?: number
    max?: number
    low?: number
    high?: number
    optimum?: number
  }

  interface HTMLModAttributes extends HTMLAttributes {
    cite?: string
    dateTime?: string
  }

  interface HTMLObjectAttributes extends HTMLAttributes {
    data?: string
    type?: string
    name?: string
    form?: string
    width?: number | string
    height?: number | string
  }

  interface HTMLOlAttributes extends HTMLAttributes {
    reversed?: boolean
    start?: number
    type?: '1' | 'a' | 'A' | 'i' | 'I'
  }

  interface HTMLOptGroupAttributes extends HTMLAttributes {
    disabled?: boolean
    label?: string
  }

  interface HTMLOptionAttributes extends HTMLAttributes {
    disabled?: boolean
    label?: string
    selected?: boolean
    value?: string | number
  }

  interface HTMLOutputAttributes extends HTMLAttributes {
    form?: string
    htmlFor?: string
    name?: string
  }

  interface HTMLParamAttributes extends HTMLAttributes {
    name?: string
    value?: string
  }

  interface HTMLProgressAttributes extends HTMLAttributes {
    max?: number
    value?: number
  }

  interface HTMLQuoteAttributes extends HTMLAttributes {
    cite?: string
  }

  interface HTMLScriptAttributes extends HTMLAttributes {
    async?: boolean
    defer?: boolean
    type?: string
    src?: string
    crossOrigin?: 'anonymous' | 'use-credentials' | ''
    integrity?: string
    noModule?: boolean
    nonce?: string
    referrerPolicy?: string
    text?: string
  }

  interface HTMLSlotAttributes extends HTMLAttributes {
    name?: string
  }

  interface HTMLSourceAttributes extends HTMLAttributes {
    type?: string
    src?: string
    srcSet?: string
    sizes?: string
    media?: string
    width?: number | string
    height?: number | string
  }

  interface HTMLStyleAttributes extends HTMLAttributes {
    media?: string
    nonce?: string
    type?: string
    scoped?: boolean
  }

  interface HTMLTableColAttributes extends HTMLAttributes {
    span?: number
  }

  interface HTMLTdAttributes extends HTMLAttributes {
    colSpan?: number
    rowSpan?: number
    headers?: string
  }

  interface HTMLTemplateAttributes extends HTMLAttributes {
    shadowRootMode?: 'open' | 'closed'
  }

  interface HTMLThAttributes extends HTMLAttributes {
    colSpan?: number
    rowSpan?: number
    headers?: string
    scope?: 'col' | 'row' | 'colgroup' | 'rowgroup'
  }

  interface HTMLTimeAttributes extends HTMLAttributes {
    dateTime?: string
  }

  interface HTMLTrackAttributes extends HTMLAttributes {
    default?: boolean
    kind?: 'subtitles' | 'captions' | 'descriptions' | 'chapters' | 'metadata'
    label?: string
    src?: string
    srcLang?: string
  }

  interface HTMLVideoAttributes extends HTMLAttributes {
    autoPlay?: boolean
    controls?: boolean
    loop?: boolean
    muted?: boolean
    playsInline?: boolean
    poster?: string
    preload?: 'auto' | 'metadata' | 'none'
    src?: string
    width?: number | string
    height?: number | string
  }
}

export {}
