import { observer } from "mobx-react-lite";
import { IconPlusCircle, LsSparks } from "../../assets/icons";
import { Space } from "../../common/Space/Space";
import { Userpic } from "../../common/Userpic/Userpic";
import { Block, Elem } from "../../utils/bem";
import { userDisplayName } from "../../utils/utilities";
import "./Annotations.styl";

export const Annotations = observer(({ annotationStore }) => {
  const entities = [
    ...annotationStore.annotations,
    ...annotationStore.predictions,
  ];

  return (
    <Elem name="section" mod={{ flat: true }}>
      <Block name="annotations-list">
        <Elem name="selected">
          <Annotation entity={annotationStore.selected}/>
        </Elem>

        <Elem name="list">
          <CreateAnnotation
            annotationStore={annotationStore}
          />

          {entities.map(ent => {
            return (
              <Annotation key={`${ent.pk ?? ent.id}${ent.type}`} entity={ent} />
            );
          })}
        </Elem>
      </Block>
    </Elem>
  );
});

const CreateAnnotation = observer(({ annotationStore }) => {
  return (
    <Elem name="create">
      <Space size="small">
        <Elem name="userpic" tag={Userpic} mod={{ prediction: true }}>
          <IconPlusCircle/>
        </Elem>
        Create Annotation
      </Space>
    </Elem>
  );
});

const Annotation = observer(({ entity }) => {
  const isPrediction = entity.type === 'prediction';
  const username = userDisplayName(entity.user ?? {
    firstName: entity.createdBy || 'Admin',
  });

  return (
    <Elem name="entity">
      <Space size="small">
        <Elem
          name="userpic"
          tag={Userpic}
          showUsername
          username={isPrediction ? entity.createdBy : null}
          user={entity.user ?? { username }}
          mod={{ prediction: isPrediction }}
        >{isPrediction && <LsSparks/>}</Elem>
        <Elem name="user">
          <Elem name="name">{username}</Elem>
        </Elem>
      </Space>
    </Elem>
  );
});
