'use client';

import { useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import ImageExtension from '@tiptap/extension-image';
import LinkExtension from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Link as LinkIcon,
  Image as ImageIcon,
  Undo,
  Redo,
  Loader2,
} from 'lucide-react';
import { fileUploadApi } from '@/lib/admin-api';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
}

// Editor mô tả dạng rich text (H2/H3, in đậm/nghiêng, danh sách, chèn ảnh) — thay cho Textarea
// thường. Nội dung lưu dạng HTML; PHẢI sanitize (DOMPurify) trước khi render ở trang public
// (dangerouslySetInnerHTML) — xem src/lib/sanitize-html.ts.
export function RichTextEditor({ value, onChange, placeholder, className = '' }: RichTextEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      ImageExtension.configure({ HTMLAttributes: { class: 'rounded-lg max-w-full' } }),
      LinkExtension.configure({ openOnClick: false, HTMLAttributes: { class: 'text-primary underline' } }),
      Placeholder.configure({ placeholder: placeholder || 'Nhập mô tả dự án...' }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class:
          'min-h-[160px] px-3.5 py-3 text-sm text-gray-700 leading-relaxed focus:outline-none ' +
          '[&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-gray-900 [&_h2]:mt-3 [&_h2]:mb-1.5 ' +
          '[&_h3]:text-base [&_h3]:font-bold [&_h3]:text-gray-900 [&_h3]:mt-2.5 [&_h3]:mb-1 ' +
          '[&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-2 ' +
          '[&_a]:text-primary [&_a]:underline [&_img]:rounded-lg [&_img]:my-2 [&_img]:max-w-full',
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  // formData.description ở form edit chỉ có sau khi fetch xong (async) — useEditor chỉ dùng
  // `content` lúc khởi tạo nên cần đồng bộ tay khi `value` từ ngoài đổi (vd. load xong dữ liệu).
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || '', { emitUpdate: false });
    }
  }, [value, editor]);

  const handleImagePick = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !editor) return;
    setIsUploading(true);
    try {
      const res = await fileUploadApi.upload(file);
      editor.chain().focus().setImage({ src: res.url }).run();
    } catch (error) {
      console.error('Upload ảnh thất bại:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const setLink = () => {
    if (!editor) return;
    const previous = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('Nhập URL liên kết:', previous || 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  if (!editor) return null;

  const ToolbarButton = ({
    onClick,
    active,
    label,
    children,
  }: {
    onClick: () => void;
    active?: boolean;
    label: string;
    children: React.ReactNode;
  }) => (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`h-8 w-8 rounded-lg flex items-center justify-center transition-colors ${
        active ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className={`rounded-xl border border-gray-200 focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10 transition-all overflow-hidden ${className}`}>
      <div className="flex flex-wrap items-center gap-0.5 border-b border-gray-100 bg-gray-50/60 px-1.5 py-1.5">
        <ToolbarButton label="In đậm" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton label="In nghiêng" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <div className="w-px h-5 bg-gray-200 mx-1" />
        <ToolbarButton label="Tiêu đề H2" active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          <Heading2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton label="Tiêu đề H3" active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
          <Heading3 className="h-4 w-4" />
        </ToolbarButton>
        <div className="w-px h-5 bg-gray-200 mx-1" />
        <ToolbarButton label="Danh sách" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton label="Danh sách số" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>
        <div className="w-px h-5 bg-gray-200 mx-1" />
        <ToolbarButton label="Chèn liên kết" active={editor.isActive('link')} onClick={setLink}>
          <LinkIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton label="Chèn ảnh" onClick={handleImagePick}>
          {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
        </ToolbarButton>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        <div className="w-px h-5 bg-gray-200 mx-1" />
        <ToolbarButton label="Hoàn tác" onClick={() => editor.chain().focus().undo().run()}>
          <Undo className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton label="Làm lại" onClick={() => editor.chain().focus().redo().run()}>
          <Redo className="h-4 w-4" />
        </ToolbarButton>
      </div>
      <EditorContent editor={editor} className="bg-white" />
    </div>
  );
}
