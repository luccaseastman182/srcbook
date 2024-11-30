import { XMLParser } from 'fast-xml-parser';

// TODO reuse and cleanup types
export interface FileContent {
  filename: string;
  content: string;
}

export type Project = {
  id: string;
  items: (File | Command)[];
  metadata?: Record<string, any>;
};

type File = {
  type: 'file';
  filename: string;
  content: string;
};

type Command = {
  type: 'command';
  content: string;
};

type ParsedResult = {
  project: {
    '@_id': string;
    file?: { '@_filename': string; '#text': string }[] | { '@_filename': string; '#text': string };
    command?: string[] | string;
    metadata?: Record<string, any>;
  };
};

export function parseProjectXML(response: string): Project {
  try {
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      textNodeName: '#text',
    });
    const result = parser.parse(response) as ParsedResult;

    if (!result.project) {
      throw new Error('Invalid response: missing project tag');
    }

    const project: Project = {
      id: result.project['@_id'],
      items: [],
      metadata: result.project.metadata || {},
    };

    const files = Array.isArray(result.project.file)
      ? result.project.file
      : [result.project.file].filter(Boolean);
    const commands = Array.isArray(result.project.command)
      ? result.project.command
      : [result.project.command].filter(Boolean);

    // TODO this ruins the order as it makes all the file changes first.
    // @FIXME: later
    for (const file of files) {
      if (file) {
        project.items.push({
          type: 'file',
          filename: file['@_filename'],
          content: file['#text'],
        });
      }
    }

    for (const command of commands) {
      if (command) {
        project.items.push({
          type: 'command',
          content: command,
        });
      }
    }

    console.log('Parsed project details:', project);
    return project;
  } catch (error) {
    console.error('Error parsing XML for the app:', error);
    throw new Error('Failed to parse XML response');
  }
}

export function buildProjectXml(files: FileContent[], projectId: string, metadata: Record<string, any> = {}): string {
  const fileXmls = files
    .map(
      (file) => `
  <file filename="${file.filename}">
    <![CDATA[
${file.content}
    ]]>
  </file>`,
    )
    .join('\n');

  const metadataXml = Object.entries(metadata)
    .map(([key, value]) => `<${key}>${value}</${key}>`)
    .join('\n');

  return `
<project id="${projectId}">
${fileXmls}
${metadataXml}
</project>
  `.trim();
}
