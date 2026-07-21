import { useEffect, useRef } from 'react';
import Quill from 'quill';
import BlotFormatter from '@enzedonline/quill-blot-formatter2';

type Props = {
  value: string;
  onChange: (value: string) => void;
};

const toolbarOptions = [
  [{ header: [1, 2, 3, false] }],
  ['bold', 'italic', 'underline', 'strike'],
  [{ list: 'ordered' }, { list: 'bullet' }],
  ['blockquote', 'link', 'image', 'video'],
  ['clean'],
];

let modulesRegistered = false;

function normalizeHtml(value: string) {
  return value.trim() === '<p><br></p>' ? '' : value;
}

export function QuillEditor({ value, onChange }: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const quillRef = useRef<Quill | null>(null);
  const silentSyncRef = useRef(false);
  const onChangeRef = useRef(onChange);
  const lastKnownHtmlRef = useRef('');

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!hostRef.current || quillRef.current) {
      return;
    }

    if (!modulesRegistered) {
      BlotFormatter.registerFormats(Quill);
      Quill.register('modules/blotFormatter2', BlotFormatter);
      modulesRegistered = true;
    }

    const editor = document.createElement('div');
    hostRef.current.innerHTML = '';
    hostRef.current.appendChild(editor);

    const quill = new Quill(editor, {
      theme: 'snow',
      modules: {
        toolbar: toolbarOptions,
        blotFormatter2: {
          resize: {
            allowResizing: true,
          },
        },
      },
      formats: [
        'header',
        'bold',
        'italic',
        'underline',
        'strike',
        'list',
        'blockquote',
        'link',
        'image',
        'video',
        'imageAlign',
        'iframeAlign',
      ],
    });

    quillRef.current = quill;

    quill.on('text-change', () => {
      if (silentSyncRef.current) {
        return;
      }

      const html = normalizeHtml(quill.root.innerHTML);
      lastKnownHtmlRef.current = html;
      onChangeRef.current(html);
    });

    if (value) {
      quill.clipboard.dangerouslyPasteHTML(value);
    }
    lastKnownHtmlRef.current = normalizeHtml(quill.root.innerHTML);

    return () => {
      quillRef.current = null;
      hostRef.current && (hostRef.current.innerHTML = '');
    };
  }, []);

  useEffect(() => {
    const quill = quillRef.current;
    if (!quill) {
      return;
    }

    const next = normalizeHtml(value);
    if (lastKnownHtmlRef.current === next) {
      return;
    }

    const selection = quill.getSelection();
    silentSyncRef.current = true;
    quill.clipboard.dangerouslyPasteHTML(next || '<p><br></p>');
    lastKnownHtmlRef.current = normalizeHtml(quill.root.innerHTML);
    if (selection) {
      quill.setSelection(selection.index, selection.length, 'silent');
    }
    silentSyncRef.current = false;
  }, [value]);

  return <div className="quill-host" ref={hostRef} />;
}
