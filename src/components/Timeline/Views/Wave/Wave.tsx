import { FC, useContext } from "react";
import { TimelineContext } from "../../Context";
import { TimelineViewProps } from "../../Types";

export const Wave: FC<TimelineViewProps> = () => {
  const { data } = useContext(TimelineContext);

  return null;
};
