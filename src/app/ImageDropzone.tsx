import { Center, Text } from "@mantine/core";
import { Dropzone, IMAGE_MIME_TYPE } from "@mantine/dropzone";

type Props = {
  onDrop: (files: File[]) => void;
  onError: (error: string) => void;
};

/** Accepts images dropped anywhere on the window. */
export function ImageDropzone({ onDrop, onError }: Props) {
  return (
    <Dropzone.FullScreen
      accept={IMAGE_MIME_TYPE}
      activateOnClick={false}
      onDrop={onDrop}
      onReject={(rejections) =>
        onError(`"${rejections[0]?.file.name ?? "File"}" is not a supported image.`)
      }
    >
      <Center h="100%">
        <Text size="xl">Drop images to open</Text>
      </Center>
    </Dropzone.FullScreen>
  );
}
