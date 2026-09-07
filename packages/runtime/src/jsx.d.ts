// Flint JSX Type Definitions
// Provides TypeScript autocompletion for HTML elements

export {};

declare global {
  namespace JSX {
    type Element = any;
    interface IntrinsicElements {
      // Document
      html: HTMLAttributes<HTMLHtmlElement>;
      head: HTMLAttributes<HTMLHeadElement>;
      body: HTMLAttributes<HTMLBodyElement>;
      title: HTMLAttributes<HTMLTitleElement>;
      meta: HTMLAttributes<HTMLMetaElement>;
      link: HTMLAttributes<HTMLLinkElement>;
      style: HTMLAttributes<HTMLStyleElement>;
      script: HTMLAttributes<HTMLScriptElement>;

      // Sections
      header: HTMLAttributes<HTMLElement>;
      nav: HTMLAttributes<HTMLElement>;
      main: HTMLAttributes<HTMLElement>;
      article: HTMLAttributes<HTMLElement>;
      section: HTMLAttributes<HTMLElement>;
      aside: HTMLAttributes<HTMLElement>;
      footer: HTMLAttributes<HTMLElement>;

      // Grouping
      div: HTMLAttributes<HTMLDivElement>;
      p: HTMLAttributes<HTMLParagraphElement>;
      hr: HTMLAttributes<HTMLHRElement>;
      pre: HTMLAttributes<HTMLPreElement>;
      blockquote: HTMLAttributes<HTMLQuoteElement>;
      ol: HTMLAttributes<HTMLOListElement>;
      ul: HTMLAttributes<HTMLUListElement>;
      li: HTMLAttributes<HTMLLIElement>;
      dl: HTMLAttributes<HTMLDListElement>;
      dt: HTMLAttributes<HTMLElement>;
      dd: HTMLAttributes<HTMLElement>;
      figure: HTMLAttributes<HTMLElement>;
      figcaption: HTMLAttributes<HTMLElement>;
      main_: HTMLAttributes<HTMLElement>;

      // Headings
      h1: HTMLAttributes<HTMLHeadingElement>;
      h2: HTMLAttributes<HTMLHeadingElement>;
      h3: HTMLAttributes<HTMLHeadingElement>;
      h4: HTMLAttributes<HTMLHeadingElement>;
      h5: HTMLAttributes<HTMLHeadingElement>;
      h6: HTMLAttributes<HTMLHeadingElement>;

      // Text
      span: HTMLAttributes<HTMLSpanElement>;
      a: AnchorHTMLAttributes<HTMLAnchorElement>;
      em: HTMLAttributes<HTMLElement>;
      strong: HTMLAttributes<HTMLElement>;
      small: HTMLAttributes<HTMLElement>;
      s: HTMLAttributes<HTMLElement>;
      cite: HTMLAttributes<HTMLElement>;
      q: HTMLAttributes<HTMLElement>;
      dfn: HTMLAttributes<HTMLElement>;
      abbr: HTMLAttributes<HTMLElement>;
      ruby: HTMLAttributes<HTMLElement>;
      rt: HTMLAttributes<HTMLElement>;
      rp: HTMLAttributes<HTMLElement>;
      data: HTMLAttributes<HTMLDataElement>;
      time: HTMLAttributes<HTMLTimeElement>;
      code: HTMLAttributes<HTMLElement>;
      var: HTMLAttributes<HTMLElement>;
      samp: HTMLAttributes<HTMLElement>;
      kbd: HTMLAttributes<HTMLElement>;
      sub: HTMLAttributes<HTMLElement>;
      sup: HTMLAttributes<HTMLElement>;
      i: HTMLAttributes<HTMLElement>;
      b: HTMLAttributes<HTMLElement>;
      u: HTMLAttributes<HTMLElement>;
      mark: HTMLAttributes<HTMLElement>;
      bdi: HTMLAttributes<HTMLElement>;
      bdo: HTMLAttributes<HTMLElement>;
      br: HTMLAttributes<HTMLBRElement>;
      wbr: HTMLAttributes<HTMLElement>;

      // Edits
      ins: HTMLAttributes<HTMLModElement>;
      del: HTMLAttributes<HTMLModElement>;

      // Embedded
      img: ImgHTMLAttributes<HTMLImageElement>;
      audio: AudioHTMLAttributes<HTMLAudioElement>;
      video: VideoHTMLAttributes<HTMLVideoElement>;
      source: SourceHTMLAttributes<HTMLSourceElement>;
      map: HTMLAttributes<HTMLMapElement>;
      area: AreaHTMLAttributes<HTMLAreaElement>;
      iframe: IframeHTMLAttributes<HTMLIFrameElement>;
      embed: HTMLAttributes<HTMLEmbedElement>;
      object: HTMLAttributes<HTMLObjectElement>;
      param: HTMLAttributes<HTMLParamElement>;

      // Tables
      table: HTMLAttributes<HTMLTableElement>;
      caption: HTMLAttributes<HTMLTableCaptionElement>;
      colgroup: HTMLAttributes<HTMLTableColElement>;
      col: HTMLAttributes<HTMLTableColElement>;
      thead: HTMLAttributes<HTMLTableSectionElement>;
      tbody: HTMLAttributes<HTMLTableSectionElement>;
      tfoot: HTMLAttributes<HTMLTableSectionElement>;
      tr: HTMLAttributes<HTMLTableRowElement>;
      td: HTMLAttributes<HTMLTableCellElement>;
      th: HTMLAttributes<HTMLTableCellElement>;

      // Forms
      form: HTMLAttributes<HTMLFormElement>;
      label: LabelHTMLAttributes<HTMLLabelElement>;
      input: InputHTMLAttributes<HTMLInputElement>;
      button: ButtonHTMLAttributes<HTMLButtonElement>;
      select: SelectHTMLAttributes<HTMLSelectElement>;
      datalist: HTMLAttributes<HTMLDataListElement>;
      optgroup: HTMLAttributes<HTMLOptGroupElement>;
      option: HTMLAttributes<HTMLOptionElement>;
      textarea: TextareaHTMLAttributes<HTMLTextAreaElement>;
      output: HTMLAttributes<HTMLOutputElement>;
      progress: HTMLAttributes<HTMLProgressElement>;
      meter: HTMLAttributes<HTMLMeterElement>;
      fieldset: HTMLAttributes<HTMLFieldSetElement>;
      legend: HTMLAttributes<HTMLLegendElement>;

      // Interactive
      details: HTMLAttributes<HTMLDetailsElement>;
      summary: HTMLAttributes<HTMLElement>;
      dialog: HTMLAttributes<HTMLDialogElement>;

      // Scripting
      template: HTMLAttributes<HTMLTemplateElement>;
      slot: HTMLAttributes<HTMLSlotElement>;
      canvas: CanvasHTMLAttributes<HTMLCanvasElement>;

      // Deprecated
      big: HTMLAttributes<HTMLElement>;
      center: HTMLAttributes<HTMLElement>;
      font: HTMLAttributes<HTMLElement>;
      strike: HTMLAttributes<HTMLElement>;
      tt: HTMLAttributes<HTMLElement>;
    }

    interface HTMLAttributes<T> extends AriaAttributes, DOMAttributes<T> {
      // Standard
      accessKey?: string;
      className?: string;
      contentEditable?: boolean | 'inherit' | 'plaintext-only';
      dir?: 'ltr' | 'rtl' | 'auto';
      draggable?: boolean;
      hidden?: boolean | 'hidden' | 'until-found';
      id?: string;
      inert?: boolean;
      inputMode?: 'none' | 'text' | 'decimal' | 'numeric' | 'tel' | 'search' | 'email' | 'url';
      is?: string;
      itemID?: string;
      itemProp?: string;
      itemRef?: string;
      itemScope?: boolean;
      itemType?: string;
      lang?: string;
      nonce?: string;
      part?: string;
      placeholder?: string;
      role?: string;
      slot?: string;
      spellCheck?: boolean;
      style?: string | Partial<CSSStyleDeclaration>;
      tabIndex?: number;
      title?: string;
      translate?: 'yes' | 'no';

      // Data attributes
      [key: `data-${string}`]: string | number | boolean | undefined;
      [key: `aria-${string}`]: string | number | boolean | undefined;

      // Event handlers
      onCopy?: (e: ClipboardEvent) => void;
      onCut?: (e: ClipboardEvent) => void;
      onPaste?: (e: ClipboardEvent) => void;
      onCompositionEnd?: (e: CompositionEvent) => void;
      onCompositionStart?: (e: CompositionEvent) => void;
      onCompositionUpdate?: (e: CompositionEvent) => void;
      onFocus?: (e: FocusEvent) => void;
      onBlur?: (e: FocusEvent) => void;
      onChange?: (e: Event) => void;
      onInput?: (e: Event) => void;
      onReset?: (e: Event) => void;
      onSubmit?: (e: Event) => void;
      onInvalid?: (e: Event) => void;
      onClick?: (e: MouseEvent) => void;
      onContextMenu?: (e: MouseEvent) => void;
      onDoubleClick?: (e: MouseEvent) => void;
      onDrag?: (e: DragEvent) => void;
      onDragEnd?: (e: DragEvent) => void;
      onDragEnter?: (e: DragEvent) => void;
      onDragExit?: (e: DragEvent) => void;
      onDragLeave?: (e: DragEvent) => void;
      onDragOver?: (e: DragEvent) => void;
      onDragStart?: (e: DragEvent) => void;
      onDrop?: (e: DragEvent) => void;
      onMouseDown?: (e: MouseEvent) => void;
      onMouseEnter?: (e: MouseEvent) => void;
      onMouseLeave?: (e: MouseEvent) => void;
      onMouseMove?: (e: MouseEvent) => void;
      onMouseOut?: (e: MouseEvent) => void;
      onMouseOver?: (e: MouseEvent) => void;
      onMouseUp?: (e: MouseEvent) => void;
      onKeyDown?: (e: KeyboardEvent) => void;
      onKeyPress?: (e: KeyboardEvent) => void;
      onKeyUp?: (e: KeyboardEvent) => void;
      onScroll?: (e: Event) => void;
      onWheel?: (e: WheelEvent) => void;
      onAnimationStart?: (e: AnimationEvent) => void;
      onAnimationEnd?: (e: AnimationEvent) => void;
      onAnimationIteration?: (e: AnimationEvent) => void;
      onTransitionEnd?: (e: TransitionEvent) => void;
      onPointerDown?: (e: PointerEvent) => void;
      onPointerMove?: (e: PointerEvent) => void;
      onPointerUp?: (e: PointerEvent) => void;
      onPointerCancel?: (e: PointerEvent) => void;
      onPointerEnter?: (e: PointerEvent) => void;
      onPointerLeave?: (e: PointerEvent) => void;
      onPointerOver?: (e: PointerEvent) => void;
      onPointerOut?: (e: PointerEvent) => void;
      onGotPointerCapture?: (e: PointerEvent) => void;
      onLostPointerCapture?: (e: PointerEvent) => void;
      onTouchStart?: (e: TouchEvent) => void;
      onTouchMove?: (e: TouchEvent) => void;
      onTouchEnd?: (e: TouchEvent) => void;
      onTouchCancel?: (e: TouchEvent) => void;
    }

    interface AnchorHTMLAttributes<T> extends HTMLAttributes<T> {
      download?: any;
      href?: string;
      hrefLang?: string;
      ping?: string;
      referrerPolicy?: ReferrerPolicy;
      rel?: string;
      target?: '_self' | '_blank' | '_parent' | '_top' | string;
      type?: string;
    }

    interface AreaHTMLAttributes<T> extends HTMLAttributes<T> {
      alt?: string;
      coords?: string;
      download?: any;
      href?: string;
      rel?: string;
      shape?: 'rect' | 'circle' | 'poly' | 'default';
      target?: '_self' | '_blank' | '_parent' | '_top' | string;
    }

    interface AudioHTMLAttributes<T> extends HTMLAttributes<T> {
      autoPlay?: boolean;
      controls?: boolean;
      loop?: boolean;
      muted?: boolean;
      preload?: 'none' | 'metadata' | 'auto' | '';
      src?: string;
    }

    interface ButtonHTMLAttributes<T> extends HTMLAttributes<T> {
      disabled?: boolean;
      form?: string;
      formAction?: string;
      formEncType?: string;
      formMethod?: string;
      formNoValidate?: boolean;
      formTarget?: string;
      name?: string;
      type?: 'submit' | 'reset' | 'button';
      value?: string | number | readonly string[];
    }

    interface CanvasHTMLAttributes<T> extends HTMLAttributes<T> {
      width?: number | string;
      height?: number | string;
    }

    interface DataHTMLAttributes<T> extends HTMLAttributes<T> {
      value?: string | number | readonly string[];
    }

    interface DetailsHTMLAttributes<T> extends HTMLAttributes<T> {
      open?: boolean;
    }

    interface DialogHTMLAttributes<T> extends HTMLAttributes<T> {
      open?: boolean;
    }

    interface EmbedHTMLAttributes<T> extends HTMLAttributes<T> {
      height?: number | string;
      src?: string;
      type?: string;
      width?: number | string;
    }

    interface FieldSetHTMLAttributes<T> extends HTMLAttributes<T> {
      disabled?: boolean;
      form?: string;
      name?: string;
    }

    interface FormHTMLAttributes<T> extends HTMLAttributes<T> {
      acceptCharset?: string;
      action?: string;
      autoComplete?: string;
      encType?: 'application/x-www-form-urlencoded' | 'multipart/form-data' | 'text/plain';
      method?: 'get' | 'post' | 'dialog' | string;
      name?: string;
      noValidate?: boolean;
      target?: '_self' | '_blank' | '_parent' | '_top' | string;
    }

    interface IframeHTMLAttributes<T> extends HTMLAttributes<T> {
      allow?: string;
      allowFullScreen?: boolean;
      allowTransparency?: boolean;
      frameBorder?: number | string;
      height?: number | string;
      loading?: 'eager' | 'lazy';
      marginHeight?: number;
      marginWidth?: number;
      name?: string;
      referrerPolicy?: ReferrerPolicy;
      sandbox?: string;
      scrolling?: 'auto' | 'yes' | 'no';
      seamless?: boolean;
      src?: string;
      srcDoc?: string;
      width?: number | string;
    }

    interface ImgHTMLAttributes<T> extends HTMLAttributes<T> {
      alt?: string;
      crossOrigin?: 'anonymous' | 'use-credentials' | '';
      decoding?: 'async' | 'auto' | 'sync';
      height?: number | string;
      loading?: 'eager' | 'lazy';
      referrerPolicy?: ReferrerPolicy;
      sizes?: string;
      src?: string;
      srcSet?: string;
      useMap?: string;
      width?: number | string;
    }

    interface InputHTMLAttributes<T> extends HTMLAttributes<T> {
      accept?: string;
      alt?: string;
      autoComplete?: string;
      capture?: boolean | 'user' | 'environment';
      checked?: boolean;
      disabled?: boolean;
      form?: string;
      formAction?: string;
      formEncType?: string;
      formMethod?: string;
      formNoValidate?: boolean;
      formTarget?: string;
      height?: number | string;
      list?: string;
      max?: number | string;
      maxLength?: number;
      min?: number | string;
      minLength?: number;
      multiple?: boolean;
      name?: string;
      pattern?: string;
      placeholder?: string;
      readOnly?: boolean;
      required?: boolean;
      size?: number;
      src?: string;
      step?: number | string;
      type?: string;
      value?: string | number | readonly string[];
      width?: number | string;
    }

    interface LabelHTMLAttributes<T> extends HTMLAttributes<T> {
      form?: string;
      htmlFor?: string;
    }

    interface LiHTMLAttributes<T> extends HTMLAttributes<T> {
      value?: number;
    }

    interface LinkHTMLAttributes<T> extends HTMLAttributes<T> {
      crossOrigin?: 'anonymous' | 'use-credentials' | '';
      href?: string;
      hrefLang?: string;
      integrity?: string;
      media?: string;
      rel?: string;
      sizes?: string;
      type?: string;
    }

    interface MapHTMLAttributes<T> extends HTMLAttributes<T> {
      name?: string;
    }

    interface MediaHTMLAttributes<T> extends HTMLAttributes<T> {
      autoPlay?: boolean;
      controls?: boolean;
      crossOrigin?: 'anonymous' | 'use-credentials' | '';
      loop?: boolean;
      muted?: boolean;
      preload?: 'none' | 'metadata' | 'auto' | '';
      src?: string;
    }

    interface MetaHTMLAttributes<T> extends HTMLAttributes<T> {
      charSet?: string;
      content?: string;
      httpEquiv?: string;
      name?: string;
    }

    interface MeterHTMLAttributes<T> extends HTMLAttributes<T> {
      form?: string;
      high?: number;
      low?: number;
      max?: number | string;
      min?: number | string;
      optimum?: number;
      value?: number | string | readonly string[];
    }

    interface ObjectHTMLAttributes<T> extends HTMLAttributes<T> {
      classID?: string;
      data?: string;
      form?: string;
      height?: number | string;
      name?: string;
      type?: string;
      useMap?: string;
      width?: number | string;
      wMode?: string;
    }

    interface OlHTMLAttributes<T> extends HTMLAttributes<T> {
      reversed?: boolean;
      start?: number;
      type?: '1' | 'a' | 'A' | 'i' | 'I';
    }

    interface OptgroupHTMLAttributes<T> extends HTMLAttributes<T> {
      disabled?: boolean;
      label?: string;
    }

    interface OptionHTMLAttributes<T> extends HTMLAttributes<T> {
      disabled?: boolean;
      label?: string;
      selected?: boolean;
      value?: string | number | readonly string[];
    }

    interface OutputHTMLAttributes<T> extends HTMLAttributes<T> {
      form?: string;
      htmlFor?: string;
      name?: string;
    }

    interface ParamHTMLAttributes<T> extends HTMLAttributes<T> {
      name?: string;
      value?: string | number | readonly string[];
    }

    interface ProgressHTMLAttributes<T> extends HTMLAttributes<T> {
      max?: number | string;
      value?: number | string | readonly string[];
    }

    interface QuoteHTMLAttributes<T> extends HTMLAttributes<T> {
      cite?: string;
    }

    interface ScriptHTMLAttributes<T> extends HTMLAttributes<T> {
      async?: boolean;
      crossOrigin?: 'anonymous' | 'use-credentials' | '';
      defer?: boolean;
      integrity?: string;
      noModule?: boolean;
      nonce?: string;
      referrerPolicy?: ReferrerPolicy;
      src?: string;
      type?: string;
    }

    interface SelectHTMLAttributes<T> extends HTMLAttributes<T> {
      autoComplete?: string;
      disabled?: boolean;
      form?: string;
      multiple?: boolean;
      name?: string;
      required?: boolean;
      size?: number;
      value?: string | number | readonly string[];
    }

    interface SlotHTMLAttributes<T> extends HTMLAttributes<T> {
      name?: string;
    }

    interface SourceHTMLAttributes<T> extends HTMLAttributes<T> {
      media?: string;
      sizes?: string;
      src?: string;
      srcSet?: string;
      type?: string;
    }

    interface StyleHTMLAttributes<T> extends HTMLAttributes<T> {
      media?: string;
      nonce?: string;
      scoped?: boolean;
      type?: string;
    }

    interface TableHTMLAttributes<T> extends HTMLAttributes<T> {
      cellPadding?: number | string;
      cellSpacing?: number | string;
      summary?: string;
      width?: number | string;
    }

    interface TextareaHTMLAttributes<T> extends HTMLAttributes<T> {
      autoComplete?: string;
      cols?: number;
      disabled?: boolean;
      form?: string;
      maxLength?: number;
      minLength?: number;
      name?: string;
      placeholder?: string;
      readOnly?: boolean;
      required?: boolean;
      rows?: number;
      value?: string | number | readonly string[];
      wrap?: 'hard' | 'soft';
    }

    interface TdHTMLAttributes<T> extends HTMLAttributes<T> {
      colSpan?: number;
      headers?: string;
      rowSpan?: number;
      scope?: string;
    }

    interface ThHTMLAttributes<T> extends HTMLAttributes<T> {
      colSpan?: number;
      headers?: string;
      rowSpan?: number;
      scope?: 'col' | 'row' | 'colgroup' | 'rowgroup';
    }

    interface TfootHTMLAttributes<T> extends HTMLAttributes<T> {}

    interface TheadHTMLAttributes<T> extends HTMLAttributes<T> {}

    interface TimeHTMLAttributes<T> extends HTMLAttributes<T> {
      dateTime?: string;
    }

    interface TrackHTMLAttributes<T> extends HTMLAttributes<T> {
      default?: boolean;
      kind?: 'subtitles' | 'captions' | 'descriptions' | 'chapters' | 'metadata';
      label?: string;
      src?: string;
      srcLang?: string;
    }

    interface VideoHTMLAttributes<T> extends MediaHTMLAttributes<T> {
      height?: number | string;
      playsInline?: boolean;
      poster?: string;
      width?: number | string;
    }

    interface WebViewHTMLAttributes<T> extends HTMLAttributes<T> {
      allowFullScreen?: boolean;
      allowpopups?: boolean;
      autosize?: boolean;
      blinkfeatures?: string;
      disableblinkfeatures?: string;
      disablegesture?: boolean;
      disablewebsecurity?: boolean;
      enableremotemodule?: boolean;
      nodeintegration?: boolean;
      partition?: string;
      plugins?: boolean;
      preload?: string;
      src?: string;
      useragent?: string;
      webpreferences?: string;
    }

    interface DOMAttributes<T> {
      children?: any;
      dangerouslySetInnerHTML?: {
        __html: string;
      };
    }

    interface AriaAttributes {
      'aria-activedescendant'?: string;
      'aria-atomic'?: boolean | 'false' | 'true';
      'aria-autocomplete'?: 'none' | 'inline' | 'list' | 'both';
      'aria-braillelabel'?: string;
      'aria-brailleroledescription'?: string;
      'aria-busy'?: boolean | 'false' | 'true';
      'aria-checked'?: boolean | 'false' | 'true' | 'mixed';
      'aria-colcount'?: number;
      'aria-colindex'?: number;
      'aria-colindextext'?: string;
      'aria-colspan'?: number;
      'aria-controls'?: string;
      'aria-current'?: boolean | 'false' | 'true' | 'page' | 'step' | 'location' | 'date' | 'time';
      'aria-describedby'?: string;
      'aria-description'?: string;
      'aria-details'?: string;
      'aria-disabled'?: boolean | 'false' | 'true';
      'aria-dropeffect'?: 'none' | 'copy' | 'execute' | 'link' | 'move' | 'popup';
      'aria-errormessage'?: string;
      'aria-expanded'?: boolean | 'false' | 'true';
      'aria-flowto'?: string;
      'aria-grabbed'?: boolean | 'false' | 'true';
      'aria-haspopup'?: boolean | 'false' | 'true' | 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog';
      'aria-hidden'?: boolean | 'false' | 'true';
      'aria-invalid'?: boolean | 'false' | 'true' | 'grammar' | 'spelling';
      'aria-keyshortcuts'?: string;
      'aria-label'?: string;
      'aria-labelledby'?: string;
      'aria-level'?: number;
      'aria-live'?: 'off' | 'assertive' | 'polite';
      'aria-modal'?: boolean | 'false' | 'true';
      'aria-multiline'?: boolean | 'false' | 'true';
      'aria-multiselectable'?: boolean | 'false' | 'true';
      'aria-orientation'?: 'horizontal' | 'vertical' | 'undefined';
      'aria-owns'?: string;
      'aria-placeholder'?: string;
      'aria-posinset'?: number;
      'aria-pressed'?: boolean | 'false' | 'true' | 'mixed';
      'aria-readonly'?: boolean | 'false' | 'true';
      'aria-relevant'?: 'additions' | 'removals' | 'text' | 'all' | 'additions removals';
      'aria-required'?: boolean | 'false' | 'true';
      'aria-roledescription'?: string;
      'aria-rowcount'?: number;
      'aria-rowindex'?: number;
      'aria-rowindextext'?: string;
      'aria-rowspan'?: number;
      'aria-selected'?: boolean | 'false' | 'true';
      'aria-setsize'?: number;
      'aria-sort'?: 'none' | 'ascending' | 'descending' | 'other';
      'aria-valuemax'?: number;
      'aria-valuemin'?: number;
      'aria-valuenow'?: number;
      'aria-valuetext'?: string;
      role?: string;
    }
  }
}
