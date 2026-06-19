import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  List, ListOrdered, CheckSquare,
  Table as TableIcon, Quote, Heading2, Heading3,
  Undo, Redo, Minus
} from "lucide-react";
import { cn } from "../../lib/utils";

interface RichEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export default function RichEditor({ content, onChange, placeholder = "开始编写内容..." }: RichEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Underline,
      Image.configure({ allowBase64: true }),
      Table.configure({ resizable: true }),
      TableRow, TableCell, TableHeader,
      TaskList, TaskItem.configure({ nested: true }),
      Placeholder.configure({ placeholder }),
    ],
    content,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none min-h-[300px] px-4 py-3 outline-none",
      },
    },
  });

  if (!editor) return null;

  const ToolBtn = ({ onClick, active, children }: { onClick: () => void; active?: boolean; children: React.ReactNode }) => (
    <button
      type="button"
      onClick={onClick}
      className={cn("p-1.5 rounded hover:bg-page-bg transition-colors text-text-muted", active && "bg-accent-light text-accent")}
    >
      {children}
    </button>
  );

  const addTable = () => { editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(); };
  const addImage = () => { const url = window.prompt("图片地址") || ""; if (url) editor.chain().focus().setImage({ src: url }).run(); };

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-0.5 px-2 py-1.5 border-b border-border bg-page-bg">
        <ToolBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")}><Bold className="w-4 h-4" /></ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")}><Italic className="w-4 h-4" /></ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")}><UnderlineIcon className="w-4 h-4" /></ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")}><Strikethrough className="w-4 h-4" /></ToolBtn>
        <span className="w-px bg-border mx-1" />
        <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })}><Heading2 className="w-4 h-4" /></ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })}><Heading3 className="w-4 h-4" /></ToolBtn>
        <span className="w-px bg-border mx-1" />
        <ToolBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")}><List className="w-4 h-4" /></ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")}><ListOrdered className="w-4 h-4" /></ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleTaskList().run()} active={editor.isActive("taskList")}><CheckSquare className="w-4 h-4" /></ToolBtn>
        <span className="w-px bg-border mx-1" />
        <ToolBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")}><Quote className="w-4 h-4" /></ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().setHorizontalRule().run()}><Minus className="w-4 h-4" /></ToolBtn>
        <ToolBtn onClick={addTable}><TableIcon className="w-4 h-4" /></ToolBtn>
        <ToolBtn onClick={addImage}><span className="text-xs font-bold">IMG</span></ToolBtn>
        <span className="w-px bg-border mx-1" />
        <ToolBtn onClick={() => editor.chain().focus().undo().run()}><Undo className="w-4 h-4" /></ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().redo().run()}><Redo className="w-4 h-4" /></ToolBtn>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
